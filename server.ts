import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Agent, setGlobalDispatcher } from 'undici';
import { createServer as createViteServer } from 'vite';

// High-performance HTTP connection pooling and keep-alive dispatcher for upstream APIs (Arkesel SMS Gateway & Paystack)
const globalHttpAgent = new Agent({
  keepAliveTimeout: 60000,
  keepAliveMaxTimeout: 600000,
  connections: 100,
  pipelining: 1
});
setGlobalDispatcher(globalHttpAgent);
import { 
  sendArkeselSMS, 
  checkArkeselBalance, 
  sanitizeSenderId, 
  extractArkeselErrorMessage 
} from './src/lib/arkeselService';
import { normalizeGhanaPhoneNumber } from './src/lib/phoneNormalizer';

// Server-side in-memory cache for central platform settings
let platformSmsConfig = {
  provider: 'arkesel',
  apiKey: process.env.ARKESEL_API_KEY || '',
  apiSecret: process.env.ARKESEL_API_SECRET || '',
  apiUrl: 'https://sms.arkesel.com/api/v2/sms/send',
  senderId: 'SCHOOLOS',
  isActive: true
};

// Central Paystack configuration on server
let platformPaystackConfig = {
  secretKey: process.env.PAYSTACK_SECRET_KEY || '',
  publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET || '',
  currency: 'GHS',
  isLive: false,
  isActive: true,
  lastTestedAt: undefined as string | undefined,
  lastTestStatus: 'untested' as 'success' | 'failed' | 'untested',
  lastTestMessage: undefined as string | undefined
};

// Central in-memory registry of issued transaction references to enforce platform-wide uniqueness
const ISSUED_TRANSACTION_REFERENCES = new Set<string>();
const ISSUED_RECEIPT_NUMBERS = new Set<string>();

/**
 * Server-authoritative Dynamic Reference & Receipt Generator
 * Generates unique, collision-resistant, cryptographically-seeded references for every payment
 */
function generateDynamicReference(
  type: 'subscription' | 'fee_payment' | 'pos_sale' | 'general' = 'general',
  schoolId?: string,
  customPrefix?: string
): { reference: string; receiptNumber: string; timestamp: string; type: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hours}${mins}${secs}`;

  let typePrefix = 'TXN';
  let receiptPrefix = 'REC';

  switch (type) {
    case 'subscription':
      typePrefix = 'SCH-SUB';
      receiptPrefix = 'REC-SUB';
      break;
    case 'fee_payment':
      typePrefix = 'SCH-FEE';
      receiptPrefix = 'REC-FEE';
      break;
    case 'pos_sale':
      typePrefix = 'POS-SALE';
      receiptPrefix = 'REC-POS';
      break;
    default:
      typePrefix = customPrefix || 'TXN';
      receiptPrefix = 'REC';
      break;
  }

  let reference = '';
  let receiptNumber = '';
  let attempts = 0;

  do {
    const entropyHex = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 hex chars e.g. A9D4E2
    const entropyReceipt = crypto.randomBytes(2).toString('hex').toUpperCase(); // 4 hex chars e.g. B1C3
    
    reference = `${typePrefix}-${dateStr}-${timeStr}-${entropyHex}`;
    receiptNumber = `${receiptPrefix}-${dateStr}-${entropyReceipt}`;
    attempts++;
  } while ((ISSUED_TRANSACTION_REFERENCES.has(reference) || ISSUED_RECEIPT_NUMBERS.has(receiptNumber)) && attempts < 15);

  ISSUED_TRANSACTION_REFERENCES.add(reference);
  ISSUED_RECEIPT_NUMBERS.add(receiptNumber);

  return {
    reference,
    receiptNumber,
    timestamp: now.toISOString(),
    type
  };
}

// Authoritative Tier Pricing Map (Source of truth on server: ZERO manual amount input from School Owners)
const AUTHORITATIVE_TIER_PRICING: Record<string, { name: string; priceGHS: number; smsAllowance: number; description: string }> = {
  plan_basic: { name: 'BASIC', priceGHS: 1500, smsAllowance: 500, description: 'Essential academic and administrative core with 500 SMS credits/term' },
  basic: { name: 'BASIC', priceGHS: 1500, smsAllowance: 500, description: 'Essential academic and administrative core with 500 SMS credits/term' },
  plan_standard: { name: 'STANDARD', priceGHS: 2500, smsAllowance: 1500, description: 'Expanded academic, PTA, examination & POS suite with 1,500 SMS credits/term' },
  standard: { name: 'STANDARD', priceGHS: 2500, smsAllowance: 1500, description: 'Expanded academic, PTA, examination & POS suite with 1,500 SMS credits/term' },
  plan_premium: { name: 'PREMIUM', priceGHS: 4000, smsAllowance: 4000, description: 'Complete enterprise suite with priority SMS and 4,000 SMS credits/term' },
  premium: { name: 'PREMIUM', priceGHS: 4000, smsAllowance: 4000, description: 'Complete enterprise suite with priority SMS and 4,000 SMS credits/term' },
};

// Global Idempotency Registry & In-flight Locks for Duplicate Prevention
interface IdempotentSmsRecord {
  idempotencyKey: string;
  messageId: string;
  schoolId: string;
  recipient: string;
  status: 'processing' | 'submitted' | 'accepted' | 'delivered' | 'failed';
  result?: any;
  promise?: Promise<any>;
  createdAt: number;
}
const IDEMPOTENT_SMS_REGISTRY = new Map<string, IdempotentSmsRecord>();

// Cleanup stale idempotency keys older than 2 hours
function cleanupIdempotentSmsRegistry() {
  const now = Date.now();
  for (const [k, v] of IDEMPOTENT_SMS_REGISTRY.entries()) {
    if (now - v.createdAt > 2 * 60 * 60 * 1000) {
      IDEMPOTENT_SMS_REGISTRY.delete(k);
    }
  }
}
setInterval(cleanupIdempotentSmsRegistry, 15 * 60 * 1000);

// Helper: dispatch Arkesel SMS internally using unified service
async function sendArkeselSMSInternal(recipient: string, message: string, senderOverride?: string, schoolName?: string): Promise<{ success: boolean; error?: string; logId?: string }> {
  if (!platformSmsConfig.apiKey || !platformSmsConfig.isActive) {
    console.log('[Arkesel SMS Internal] Skipped (API Key not configured or disabled)');
    return { success: false, error: 'SMS Gateway inactive or missing API Key' };
  }

  const result = await sendArkeselSMS({
    apiKey: platformSmsConfig.apiKey,
    apiUrl: platformSmsConfig.apiUrl,
    sender: senderOverride || platformSmsConfig.senderId || 'SCHOOLOS',
    recipient,
    message,
    schoolName
  });

  return {
    success: result.success,
    error: result.errorDetails,
    logId: result.logId
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware with rawBody capturing for Paystack webhook HMAC verification
  app.use(express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ 
      status: 'ok', 
      smsProvider: platformSmsConfig.provider, 
      smsConfigured: !!platformSmsConfig.apiKey,
      paystackConfigured: !!platformPaystackConfig.secretKey,
      paystackMode: platformPaystackConfig.isLive ? 'live' : 'test'
    });
  });

  // ----------------------------------------------------
  // PAYSTACK CONFIGURATION & STATUS ENDPOINTS
  // ----------------------------------------------------

  // Get current Paystack configuration status (never returns secret key directly)
  app.get('/api/paystack/status', (_req, res) => {
    res.json({
      isActive: platformPaystackConfig.isActive,
      isLive: platformPaystackConfig.isLive,
      hasSecretKey: !!platformPaystackConfig.secretKey,
      secretKeyMasked: platformPaystackConfig.secretKey 
        ? `${platformPaystackConfig.secretKey.slice(0, 7)}••••••••${platformPaystackConfig.secretKey.slice(-4)}` 
        : null,
      publicKey: platformPaystackConfig.publicKey,
      currency: platformPaystackConfig.currency,
      lastTestedAt: platformPaystackConfig.lastTestedAt,
      lastTestStatus: platformPaystackConfig.lastTestStatus,
      lastTestMessage: platformPaystackConfig.lastTestMessage,
      webhookUrl: `${process.env.APP_URL || 'https://your-domain.com'}/api/paystack/webhook`
    });
  });

  // Super Admin: Update Paystack Settings
  app.post('/api/paystack/config', (req, res) => {
    try {
      const { secretKey, publicKey, webhookSecret, currency, isLive, isActive } = req.body;
      if (secretKey !== undefined && secretKey.trim()) {
        platformPaystackConfig.secretKey = secretKey.trim();
      }
      if (publicKey !== undefined) {
        platformPaystackConfig.publicKey = publicKey.trim();
      }
      if (webhookSecret !== undefined) {
        platformPaystackConfig.webhookSecret = webhookSecret.trim();
      }
      if (currency !== undefined) {
        platformPaystackConfig.currency = currency.trim().toUpperCase() || 'GHS';
      }
      if (isLive !== undefined) {
        platformPaystackConfig.isLive = Boolean(isLive);
      }
      if (isActive !== undefined) {
        platformPaystackConfig.isActive = Boolean(isActive);
      }

      console.log(`[Paystack Config Updated] Live: ${platformPaystackConfig.isLive}, Has Secret: ${!!platformPaystackConfig.secretKey}`);

      res.json({
        success: true,
        message: 'Paystack configuration updated successfully.',
        hasSecretKey: !!platformPaystackConfig.secretKey,
        isLive: platformPaystackConfig.isLive,
        publicKey: platformPaystackConfig.publicKey
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Super Admin: Test Paystack API credentials
  app.post('/api/paystack/test', async (req, res) => {
    const { secretKey: providedSecretKey } = req.body;
    const secretKey = (providedSecretKey || platformPaystackConfig.secretKey || '').trim();

    if (!secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error: Paystack Secret Key is required. Please provide your sk_test_... or sk_live_... key.'
      });
    }

    try {
      console.log('[Paystack API Test] Verifying credentials with Paystack API...');
      
      // Paystack integration verification test endpoint
      const response = await fetch('https://api.paystack.co/integration/payment_session_timeout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data: any = await response.json();
      const isSuccess = response.ok && data?.status === true;

      if (isSuccess) {
        platformPaystackConfig.lastTestedAt = new Date().toISOString();
        platformPaystackConfig.lastTestStatus = 'success';
        platformPaystackConfig.lastTestMessage = 'Connection successful: Paystack API validated.';

        return res.json({
          success: true,
          message: 'Paystack Connection Verified: Secret Key is valid and active on Paystack.',
          data: data.data,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMsg = data?.message || `Paystack API returned status ${response.status}`;
        platformPaystackConfig.lastTestedAt = new Date().toISOString();
        platformPaystackConfig.lastTestStatus = 'failed';
        platformPaystackConfig.lastTestMessage = `Connection failed: ${errorMsg}`;

        return res.status(400).json({
          success: false,
          message: `Paystack Verification Failed: ${errorMsg}`,
          paystackResponse: data
        });
      }
    } catch (err: any) {
      console.error('[Paystack API Test Error]:', err);
      platformPaystackConfig.lastTestedAt = new Date().toISOString();
      platformPaystackConfig.lastTestStatus = 'failed';
      platformPaystackConfig.lastTestMessage = `Network Error: ${err?.message}`;

      return res.status(502).json({
        success: false,
        message: `Network failure connecting to Paystack API: ${err?.message}`
      });
    }
  });

  // ----------------------------------------------------
  // DYNAMIC TRANSACTION REFERENCE & RECEIPT GENERATION
  // ----------------------------------------------------

  // Authoritative server-side dynamic reference generator endpoint
  app.post('/api/transactions/generate-reference', (req, res) => {
    try {
      const { type = 'general', schoolId, prefix } = req.body || {};
      const generated = generateDynamicReference(type, schoolId, prefix);
      return res.json({
        success: true,
        reference: generated.reference,
        receiptNumber: generated.receiptNumber,
        timestamp: generated.timestamp,
        type: generated.type
      });
    } catch (err: any) {
      console.error('[Generate Reference Error]:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Failed to generate transaction reference' });
    }
  });

  // Authoritative server-side reference verification / validation endpoint
  app.post('/api/transactions/validate-reference', (req, res) => {
    try {
      const { reference } = req.body || {};
      if (!reference || typeof reference !== 'string') {
        return res.status(400).json({ success: false, valid: false, message: 'Valid reference string is required' });
      }
      
      const isKnown = ISSUED_TRANSACTION_REFERENCES.has(reference.trim());
      return res.json({
        success: true,
        valid: true,
        reference: reference.trim(),
        isRegistered: isKnown
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || 'Failed to validate reference' });
    }
  });

  // ----------------------------------------------------
  // REAL PAYSTACK TRANSACTION INITIALIZATION
  // ----------------------------------------------------

  // School Owner initiates subscription payment:
  // THE SERVER AUTHORITATIVELY DETERMINES THE CHARGE AMOUNT AND DYNAMIC REFERENCE.
  // CLIENT DOES NOT PROVIDE AMOUNT OR STATIC REFERENCES.
  app.post('/api/paystack/initialize', async (req, res) => {
    try {
      const {
        schoolId,
        planId,
        tierCode,
        academicYear,
        term,
        email,
        phone,
        schoolName,
        callbackUrl
      } = req.body;

      if (!schoolId) {
        return res.status(400).json({ success: false, error: 'schoolId is required.' });
      }

      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required for receipt delivery.' });
      }

      const secretKey = platformPaystackConfig.secretKey.trim();
      if (!secretKey) {
        return res.status(400).json({
          success: false,
          error: 'Paystack Gateway is not configured. The Super Admin must enter the Paystack Secret Key in Platform Settings.'
        });
      }

      if (!platformPaystackConfig.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Platform Subscription Payments are currently disabled by the Super Admin.'
        });
      }

      // Authoritative pricing lookup
      const lookupKey = (planId || tierCode || 'basic').toLowerCase();
      const planInfo = AUTHORITATIVE_TIER_PRICING[lookupKey] || AUTHORITATIVE_TIER_PRICING['basic'];
      const amountGHS = planInfo.priceGHS;
      const amountPesewas = Math.round(amountGHS * 100); // Paystack operates in minor currency units (pesewas)
      const tierName = planInfo.name;

      // Dynamic unique reference & receipt generation (Server-authoritative)
      const dynamicGen = generateDynamicReference('subscription', schoolId);
      const reference = dynamicGen.reference;
      const receiptNumber = dynamicGen.receiptNumber;

      const currentYear = academicYear || '2025/2026';
      const currentTerm = term || 'Term 2';

      console.log(`[Paystack Initialize] School: "${schoolName || schoolId}", Tier: ${tierName}, Amount: GH₵${amountGHS} (${amountPesewas} pesewas), Ref: ${reference}, Receipt: ${receiptNumber}`);

      // Call Paystack API
      const paystackPayload = {
        email: email.trim(),
        amount: amountPesewas,
        currency: platformPaystackConfig.currency || 'GHS',
        reference: reference,
        callback_url: callbackUrl || undefined,
        channels: ['mobile_money', 'card', 'bank', 'qr', 'ussd'],
        metadata: {
          schoolId,
          schoolName: schoolName || 'SchoolOS Institution',
          planId: planId || `plan_${tierName.toLowerCase()}`,
          tierName,
          academicYear: currentYear,
          term: currentTerm,
          receiptNumber: receiptNumber,
          customerPhone: phone || '',
          paymentType: 'school_subscription',
          custom_fields: [
            { display_name: "School Name", variable_name: "school_name", value: schoolName || schoolId },
            { display_name: "Subscription Tier", variable_name: "tier_name", value: tierName },
            { display_name: "Academic Term", variable_name: "academic_term", value: `${currentYear} • ${currentTerm}` },
            { display_name: "Official Receipt", variable_name: "receipt_number", value: receiptNumber },
            { display_name: "Platform", variable_name: "platform", value: "SchoolOS Online" }
          ]
        }
      };

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paystackPayload)
      });

      const data: any = await response.json();

      if (response.ok && data?.status === true) {
        return res.json({
          success: true,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference || reference,
          receiptNumber: receiptNumber,
          amountGHS: amountGHS,
          amountPesewas: amountPesewas,
          tierName: tierName,
          publicKey: platformPaystackConfig.publicKey,
          message: 'Payment initialized successfully.'
        });
      } else {
        const errorMsg = data?.message || 'Failed to initialize Paystack transaction.';
        console.error('[Paystack Initialize Error]:', data);
        return res.status(400).json({
          success: false,
          error: errorMsg,
          paystackResponse: data
        });
      }
    } catch (err: any) {
      console.error('[Paystack Initialize Network Error]:', err);
      return res.status(500).json({
        success: false,
        error: `Network error initializing Paystack transaction: ${err?.message}`
      });
    }
  });

  // Student School Fees Paystack Online Checkout Initialization
  app.post('/api/paystack/initialize-fee', async (req, res) => {
    try {
      const {
        schoolId,
        studentId,
        studentName,
        admissionNumber,
        classroomName,
        amountGHS,
        payerEmail,
        payerPhone,
        payerName,
        academicYear,
        term,
        schoolName,
        callbackUrl
      } = req.body;

      if (!schoolId || !studentId || !amountGHS || amountGHS <= 0) {
        return res.status(400).json({ success: false, error: 'schoolId, studentId, and valid amountGHS are required.' });
      }

      if (!payerEmail || !payerEmail.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required for payment receipt.' });
      }

      const secretKey = platformPaystackConfig.secretKey.trim();
      if (!secretKey) {
        return res.status(400).json({
          success: false,
          error: 'Paystack Gateway is not configured.'
        });
      }

      const amountPesewas = Math.round(Number(amountGHS) * 100);
      const dynamicGen = generateDynamicReference('fee_payment', schoolId);
      const reference = dynamicGen.reference;
      const receiptNumber = dynamicGen.receiptNumber;

      const currentYear = academicYear || '2025/2026';
      const currentTerm = term || 'Term 2';

      console.log(`[Paystack Fee Initialize] Student: "${studentName}", Amount: GH₵${amountGHS}, Ref: ${reference}, Receipt: ${receiptNumber}`);

      const paystackPayload = {
        email: payerEmail.trim(),
        amount: amountPesewas,
        currency: platformPaystackConfig.currency || 'GHS',
        reference: reference,
        callback_url: callbackUrl || undefined,
        channels: ['mobile_money', 'card', 'bank', 'qr', 'ussd'],
        metadata: {
          schoolId,
          schoolName: schoolName || 'SchoolOS Institution',
          studentId,
          studentName: studentName || 'Student',
          admissionNumber: admissionNumber || '',
          classroomName: classroomName || '',
          payerName: payerName || 'Parent / Guardian',
          payerPhone: payerPhone || '',
          receiptNumber: receiptNumber,
          academicYear: currentYear,
          term: currentTerm,
          paymentType: 'school_fees',
          custom_fields: [
            { display_name: "Student Name", variable_name: "student_name", value: studentName || studentId },
            { display_name: "Admission No.", variable_name: "admission_number", value: admissionNumber || 'N/A' },
            { display_name: "Class", variable_name: "classroom_name", value: classroomName || 'N/A' },
            { display_name: "Official Receipt", variable_name: "receipt_number", value: receiptNumber }
          ]
        }
      };

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paystackPayload)
      });

      const data: any = await response.json();

      if (response.ok && data?.status === true) {
        return res.json({
          success: true,
          authorizationUrl: data.data.authorization_url,
          accessCode: data.data.access_code,
          reference: data.data.reference || reference,
          receiptNumber: receiptNumber,
          amountGHS: Number(amountGHS),
          amountPesewas: amountPesewas,
          publicKey: platformPaystackConfig.publicKey,
          message: 'Fee payment checkout initialized.'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data?.message || 'Failed to initialize Paystack fee payment.',
          paystackResponse: data
        });
      }
    } catch (err: any) {
      console.error('[Paystack Fee Initialize Error]:', err);
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // ----------------------------------------------------
  // REAL PAYSTACK TRANSACTION VERIFICATION
  // ----------------------------------------------------

  // Verify transaction with Paystack API server-side
  app.get('/api/paystack/verify/:reference', async (req, res) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ success: false, error: 'Transaction reference is required.' });
      }

      const secretKey = platformPaystackConfig.secretKey.trim();
      if (!secretKey) {
        return res.status(400).json({ success: false, error: 'Paystack Secret Key is missing.' });
      }

      console.log(`[Paystack Verification] Checking reference "${reference}"...`);

      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data: any = await response.json();

      if (response.ok && data?.status === true) {
        const txData = data.data;
        const isPaid = txData.status === 'success';
        const amountGHS = txData.amount / 100;
        const metadata = txData.metadata || {};
        
        // Use the dynamically generated receipt number from metadata, or derive structured receipt number
        const receiptNumber = metadata.receiptNumber || (
          metadata.paymentType === 'school_fees'
            ? `REC-FEE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${reference.slice(-4)}`
            : `REC-SUB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${reference.slice(-4)}`
        );

        const paymentChannel = txData.channel || 'mobile_money';
        const channelDetails = {
          cardType: txData.authorization?.card_type || undefined,
          last4: txData.authorization?.last4 || undefined,
          bank: txData.authorization?.bank || undefined,
          mobileNetwork: txData.authorization?.channel === 'mobile_money' ? (txData.authorization?.brand || 'MTN / MoMo') : undefined,
          customerPhone: txData.customer?.phone || metadata.customerPhone || metadata.payerPhone || undefined
        };

        const resultPayload = {
          success: isPaid,
          status: txData.status,
          reference: txData.reference || reference,
          amountGHS: amountGHS,
          currency: txData.currency || 'GHS',
          paidAt: txData.paid_at || new Date().toISOString(),
          paymentChannel: paymentChannel,
          channelDetails: channelDetails,
          receiptNumber: receiptNumber,
          paymentType: metadata.paymentType || 'school_subscription',
          tierName: metadata.tierName || 'BASIC',
          schoolId: metadata.schoolId,
          schoolName: metadata.schoolName,
          studentId: metadata.studentId,
          studentName: metadata.studentName,
          admissionNumber: metadata.admissionNumber,
          classroomName: metadata.classroomName,
          payerName: metadata.payerName,
          academicYear: metadata.academicYear || '2025/2026',
          term: metadata.term || 'Term 2',
          customerEmail: txData.customer?.email || metadata.payerEmail || '',
          customerPhone: txData.customer?.phone || metadata.customerPhone || metadata.payerPhone || '',
          gatewayResponse: txData.gateway_response || 'Successful'
        };

        // If paid, dispatch confirmation SMS via Arkesel
        if (isPaid && (metadata.customerPhone || metadata.payerPhone || txData.customer?.phone)) {
          const phoneToSend = metadata.customerPhone || metadata.payerPhone || txData.customer?.phone;
          const smsText = metadata.paymentType === 'school_fees'
            ? `Fee Payment Confirmed! GH₵${amountGHS} received for ${metadata.studentName || 'Student'} (${metadata.classroomName || 'Class'}). Receipt: ${receiptNumber}. Ref: ${reference}. Thank you!`
            : `Payment Confirmed! GH₵${amountGHS} received for ${metadata.tierName || 'Platform'} subscription (${metadata.term || 'Current Term'}). Receipt: ${receiptNumber}. Ref: ${reference}. Thank you for using SchoolOS!`;
          
          sendArkeselSMSInternal(phoneToSend, smsText, 'SCHOOLOS', metadata.schoolName).catch(err => {
            console.error('[Payment Confirmation SMS Error]:', err);
          });
        }

        return res.json({
          success: true,
          verification: resultPayload
        });
      } else {
        return res.status(400).json({
          success: false,
          error: data?.message || 'Verification failed on Paystack.',
          data: data
        });
      }
    } catch (err: any) {
      console.error('[Paystack Verify Network Error]:', err);
      return res.status(500).json({
        success: false,
        error: `Network error verifying transaction: ${err?.message}`
      });
    }
  });

  // ----------------------------------------------------
  // PAYSTACK WEBHOOK HANDLER
  // ----------------------------------------------------

  app.post('/api/paystack/webhook', async (req: any, res) => {
    try {
      const signature = req.headers['x-paystack-signature'];
      const secretKey = platformPaystackConfig.secretKey.trim();

      if (signature && secretKey && req.rawBody) {
        const hash = crypto.createHmac('sha512', secretKey).update(req.rawBody).digest('hex');
        if (hash !== signature) {
          console.warn('[Paystack Webhook] Invalid signature rejected.');
          return res.status(401).send('Invalid signature');
        }
      }

      const event = req.body;
      console.log(`[Paystack Webhook Received] Event: "${event?.event}" | Ref: "${event?.data?.reference}"`);

      if (event?.event === 'charge.success') {
        const tx = event.data;
        const metadata = tx.metadata || {};
        const amountGHS = tx.amount / 100;
        console.log(`[Paystack Webhook Success] Processed subscription for school "${metadata.schoolName || metadata.schoolId}", Tier: ${metadata.tierName}, GH₵${amountGHS}`);
        
        // Dispatch SMS notification if phone is available
        const phone = metadata.customerPhone || tx.customer?.phone;
        if (phone) {
          const smsText = `SchoolOS Alert: Subscription payment of GH₵${amountGHS} for ${metadata.tierName || 'School'} has been verified successfully. Receipt Ref: ${tx.reference}.`;
          await sendArkeselSMSInternal(phone, smsText, 'SCHOOLOS', metadata.schoolName);
        }
      }

      // Always return 200 to Paystack to acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (err: any) {
      console.error('[Paystack Webhook Handler Error]:', err);
      return res.status(200).json({ received: true, error: err?.message });
    }
  });

  // ----------------------------------------------------
  // SCHEDULED / MANUAL TERM-END SUBSCRIPTION REMINDERS
  // ----------------------------------------------------

  app.post('/api/subscriptions/run-reminders', async (req, res) => {
    try {
      const { schools, academicYear, term } = req.body;
      const targetSchools: any[] = Array.isArray(schools) ? schools : [];

      console.log(`[Term Subscription Reminders] Scanning ${targetSchools.length} registered schools for term renewal reminders...`);

      const notifiedSchools: any[] = [];
      let remindersSent = 0;

      for (const sc of targetSchools) {
        const phone = sc.registeredPhone || sc.phone || sc.ownerPhone;
        if (!phone) continue;

        const tierCode = (sc.subscriptionPlan || 'basic').toLowerCase();
        const plan = AUTHORITATIVE_TIER_PRICING[tierCode] || AUTHORITATIVE_TIER_PRICING['basic'];
        const amountGHS = plan.priceGHS;
        const curTerm = term || sc.currentTerm || 'Term 2';
        const curYear = academicYear || sc.currentAcademicYear || '2025/2026';

        const reminderMsg = `Dear ${sc.name} Administrator, your SchoolOS ${plan.name} subscription renewal of GH₵${amountGHS} for ${curYear} ${curTerm} is due. Please renew in your portal to avoid interruption.`;

        const smsRes = await sendArkeselSMSInternal(phone, reminderMsg, 'SCHOOLOS', sc.name);
        
        if (smsRes.success) {
          remindersSent++;
          notifiedSchools.push({
            schoolId: sc.id,
            schoolName: sc.name,
            recipientPhone: phone,
            planName: plan.name,
            amountGHS: amountGHS,
            daysRemaining: 7,
            status: 'sent'
          });
        }
      }

      res.json({
        success: true,
        totalProcessed: targetSchools.length,
        remindersSent: remindersSent,
        schoolsNotified: notifiedSchools,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[Subscription Reminders Error]:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // ----------------------------------------------------
  // ARKESEL SMS COMMUNICATIONS
  // ----------------------------------------------------

  // Get current platform communication status (never returns API secret to frontend)
  app.get('/api/communication/status', (_req, res) => {
    res.json({
      provider: platformSmsConfig.provider,
      isActive: platformSmsConfig.isActive,
      hasApiKey: !!platformSmsConfig.apiKey,
      apiKeyMasked: platformSmsConfig.apiKey ? `${platformSmsConfig.apiKey.slice(0, 4)}••••••••${platformSmsConfig.apiKey.slice(-3)}` : null,
      apiUrl: platformSmsConfig.apiUrl,
      senderId: platformSmsConfig.senderId
    });
  });

  // Save / update central SMS configuration on server
  app.post('/api/communication/config', (req, res) => {
    try {
      const { apiKey, apiSecret, apiUrl, senderId, isActive, provider } = req.body;
      if (provider) platformSmsConfig.provider = provider;
      if (apiKey !== undefined) platformSmsConfig.apiKey = apiKey.trim();
      if (apiSecret !== undefined) platformSmsConfig.apiSecret = apiSecret.trim();
      if (apiUrl) {
        platformSmsConfig.apiUrl = apiUrl.includes('hubtel') ? 'https://sms.arkesel.com/api/v2/sms/send' : apiUrl.trim();
      }
      if (senderId) platformSmsConfig.senderId = senderId.trim();
      if (isActive !== undefined) platformSmsConfig.isActive = Boolean(isActive);

      res.json({
        success: true,
        message: 'Central SMS Gateway credentials saved securely.',
        hasApiKey: !!platformSmsConfig.apiKey
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Dedicated Arkesel Balance Check (GET & POST)
  const handleBalanceCheck = async (req: express.Request, res: express.Response) => {
    try {
      const apiKey = (req.body?.apiKey || req.query?.apiKey || platformSmsConfig.apiKey || '').trim();
      const apiUrl = (req.body?.apiUrl || req.query?.apiUrl || 'https://sms.arkesel.com/api/v2/clients/balance-details').trim();

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          statusCode: 400,
          error: 'Arkesel API Key is not configured. Please configure it in Super Admin platform settings.'
        });
      }

      const balanceResult = await checkArkeselBalance(apiKey, apiUrl);
      return res.status(200).json({
        success: balanceResult.success,
        statusCode: balanceResult.statusCode,
        smsBalance: balanceResult.balance,
        mainBalance: balanceResult.mainBalance,
        currency: 'GHS',
        message: balanceResult.message,
        rawResponse: balanceResult.rawResponse,
        checkedAt: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        statusCode: 500,
        error: `Failed to retrieve Arkesel balance: ${err?.message}`
      });
    }
  };

  app.get('/api/communication/balance', handleBalanceCheck);
  app.post('/api/communication/balance', handleBalanceCheck);

  // Test Arkesel API Key / Balance endpoint (GET https://sms.arkesel.com/api/v2/clients/balance-details)
  app.post('/api/communication/test-key', async (req, res) => {
    try {
      const { apiKey: providedApiKey, apiUrl: providedApiUrl } = req.body || {};
      const apiKey = (providedApiKey || platformSmsConfig.apiKey || '').trim();

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          statusCode: 400,
          provider: 'arkesel',
          message: 'Validation Error: Arkesel API Key is required. Please enter your Arkesel API key in platform settings.',
          responsePayload: { error: 'MISSING_API_KEY' },
          timestamp: new Date().toISOString()
        });
      }

      const balanceResult = await checkArkeselBalance(apiKey, providedApiUrl || 'https://sms.arkesel.com/api/v2/clients/balance-details');
      return res.status(200).json({
        success: balanceResult.success,
        statusCode: balanceResult.statusCode,
        provider: 'arkesel',
        message: balanceResult.message,
        responsePayload: {
          balance: balanceResult.balance,
          mainBalance: balanceResult.mainBalance,
          rawResponse: balanceResult.rawResponse
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        statusCode: 500,
        provider: 'arkesel',
        message: `Server Error: ${err?.message || 'Failed to verify Arkesel key'}`,
        responsePayload: { error: err?.message },
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test SMS Gateway with real Arkesel API request
  app.post('/api/communication/test-sms', async (req, res) => {
    try {
      const {
        apiKey: providedApiKey,
        apiUrl: providedApiUrl,
        senderId: providedSenderId,
        testRecipient,
        testMessage,
        schoolName
      } = req.body || {};

      const apiKey = (providedApiKey || platformSmsConfig.apiKey || '').trim();
      const apiUrl = (providedApiUrl || platformSmsConfig.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send').trim();
      const sender = sanitizeSenderId(providedSenderId || platformSmsConfig.senderId || 'SCHOOLOS');

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          statusCode: 400,
          provider: 'arkesel',
          message: 'Validation Error: Arkesel API Key is required. Please enter your Arkesel API key in platform settings.',
          responsePayload: { error: 'MISSING_API_KEY' },
          timestamp: new Date().toISOString()
        });
      }

      if (!testRecipient || typeof testRecipient !== 'string' || !testRecipient.trim()) {
        return res.status(200).json({
          success: false,
          statusCode: 400,
          provider: 'arkesel',
          message: 'Validation Error: Test recipient phone number is required.',
          responsePayload: { error: 'MISSING_RECIPIENT' },
          timestamp: new Date().toISOString()
        });
      }

      const phoneResult = normalizeGhanaPhoneNumber(testRecipient.trim());
      if (!phoneResult.isValid || !phoneResult.formatted) {
        return res.status(200).json({
          success: false,
          statusCode: 400,
          provider: 'arkesel',
          message: `Validation Error: ${phoneResult.error || 'Invalid Ghanaian phone number format.'}`,
          responsePayload: { error: 'INVALID_PHONE_NUMBER', raw: testRecipient },
          timestamp: new Date().toISOString()
        });
      }

      const messageContent = testMessage?.trim() || 
        `[${schoolName || 'SchoolOS'}] Central Arkesel SMS gateway connection test succeeded at ${new Date().toLocaleTimeString('en-GH')}.`;

      const sendResult = await sendArkeselSMS({
        apiKey,
        apiUrl,
        sender,
        recipient: phoneResult.formatted,
        message: messageContent,
        schoolName
      });

      return res.status(200).json({
        success: sendResult.success,
        statusCode: sendResult.statusCode,
        provider: 'arkesel',
        message: sendResult.message,
        responsePayload: {
          status: sendResult.success ? 'success' : 'failed',
          arkeselResponse: sendResult.rawResponse,
          recipient: sendResult.recipient,
          sender: sendResult.sender,
          httpStatus: sendResult.statusCode,
          costGHS: sendResult.costGHS,
          logId: sendResult.logId
        },
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        statusCode: 500,
        provider: 'arkesel',
        message: `Server Execution Error: ${err?.message || 'Failed to dispatch test SMS'}`,
        responsePayload: { error: err?.message },
        timestamp: new Date().toISOString()
      });
    }
  });

  // Real Multi-Tenant SMS Dispatch Endpoint with True Idempotency, Performance Tracking & Fast Submission Semantics
  app.post('/api/communication/send-sms', async (req, res) => {
    const reqStartTime = performance.now();
    try {
      const {
        schoolId,
        schoolName,
        approvedSenderId,
        recipient,
        recipients: rawRecipients,
        recipientName,
        message,
        category,
        relatedRecordId,
        idempotencyKey: clientProvidedKey,
        messageId: clientMessageId,
        apiKey: clientProvidedKeySecret
      } = req.body || {};

      if (!schoolId) {
        return res.status(200).json({ 
          success: false, 
          status: 'failed', 
          error: 'Multi-Tenant Error: schoolId is required' 
        });
      }

      if ((!recipient && (!Array.isArray(rawRecipients) || rawRecipients.length === 0)) || !message) {
        return res.status(200).json({ 
          success: false, 
          status: 'failed', 
          error: 'Recipient phone number and message body are required' 
        });
      }

      const apiKey = (clientProvidedKeySecret || platformSmsConfig.apiKey || '').trim();
      if (!apiKey) {
        return res.status(200).json({ 
          success: false, 
          status: 'failed', 
          error: 'SMS Gateway Not Configured. The Super Admin has not yet configured the Arkesel API key in platform settings.' 
        });
      }

      if (!platformSmsConfig.isActive) {
        return res.status(200).json({
          success: false,
          status: 'failed',
          error: 'Platform SMS Gateway is currently disabled in Super Admin settings.'
        });
      }

      // Collect and normalize recipients
      const validRecipients: string[] = [];
      if (Array.isArray(rawRecipients) && rawRecipients.length > 0) {
        for (const r of rawRecipients) {
          if (r && typeof r === 'string') {
            const p = normalizeGhanaPhoneNumber(r);
            if (p.isValid && p.formatted && !validRecipients.includes(p.formatted)) {
              validRecipients.push(p.formatted);
            }
          }
        }
      } else if (recipient) {
        const p = normalizeGhanaPhoneNumber(recipient);
        if (p.isValid && p.formatted) {
          validRecipients.push(p.formatted);
        }
      }

      if (validRecipients.length === 0) {
        return res.status(200).json({
          success: false,
          status: 'no_phone',
          error: 'Invalid Ghanaian Phone Number(s): Must be a valid Ghanaian number formatted with +233.'
        });
      }

      const primaryRecipient = validRecipients[0];
      const isBatch = validRecipients.length > 1;

      const sender = sanitizeSenderId(approvedSenderId || schoolName || platformSmsConfig.senderId || 'SCHOOLOS');
      let finalMessage = String(message).trim();
      if (schoolName && !finalMessage.toLowerCase().includes(String(schoolName).toLowerCase())) {
        finalMessage = `${schoolName}: ${finalMessage}`;
      }

      const prepTimeMs = Number((performance.now() - reqStartTime).toFixed(1));

      // 1. Authoritative Idempotency & Duplicate Request Protection
      const effectiveKey = clientProvidedKey || (
        relatedRecordId 
          ? `sms_${schoolId}_${category || 'notif'}_${relatedRecordId}_${primaryRecipient}`
          : `sms_${schoolId}_${primaryRecipient}_${crypto.createHash('md5').update(finalMessage).digest('hex').slice(0, 10)}_${Math.floor(Date.now() / 60000)}`
      );

      const existingRecord = IDEMPOTENT_SMS_REGISTRY.get(effectiveKey);
      if (existingRecord && !isBatch) {
        console.log(`[SMS Idempotency Guard] Duplicate SMS intercepted for key: "${effectiveKey}"`);
        if (existingRecord.status === 'processing') {
          return res.status(200).json({
            success: true,
            status: 'submitted',
            messageId: existingRecord.messageId,
            idempotencyKey: effectiveKey,
            duplicateSuppressed: true,
            providerResponse: 'SMS submission is in-flight and accepted by gateway (Duplicate Suppressed)',
            performance: { prepMs: prepTimeMs, totalBackendMs: Number((performance.now() - reqStartTime).toFixed(1)), lifecycle: 'SUBMITTED' },
            timestamp: new Date().toISOString()
          });
        }
        if (existingRecord.status === 'accepted' || existingRecord.status === 'submitted' || existingRecord.status === 'delivered') {
          return res.status(200).json({
            ...existingRecord.result,
            duplicateSuppressed: true,
            providerResponse: 'SMS already dispatched to Arkesel Gateway (Duplicate Suppressed)'
          });
        }
      }

      // Register in-flight request lock
      const messageId = clientMessageId || `MSG-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      IDEMPOTENT_SMS_REGISTRY.set(effectiveKey, {
        idempotencyKey: effectiveKey,
        messageId,
        schoolId,
        recipient: primaryRecipient,
        status: 'processing',
        createdAt: Date.now()
      });

      // Calculate segments (160 characters for single, 153 per segment for multipart)
      const charCount = finalMessage.length;
      const smsSegments = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

      const arkeselStartTime = performance.now();
      const sendResult = await sendArkeselSMS({
        apiKey,
        apiUrl: platformSmsConfig.apiUrl,
        sender,
        recipient: primaryRecipient,
        recipients: validRecipients,
        message: finalMessage,
        schoolName
      });
      const arkeselGatewayMs = Number((performance.now() - arkeselStartTime).toFixed(1));
      const totalBackendMs = Number((performance.now() - reqStartTime).toFixed(1));

      if (sendResult.success) {
        console.log(`[SMS Perf] ID: ${messageId} | Count: ${validRecipients.length} | Status: SUBMITTED | Arkesel Gateway: ${arkeselGatewayMs}ms | Total Backend: ${totalBackendMs}ms`);

        const responseData = {
          success: true,
          status: 'submitted', // Immediate submission confirmation; carrier delivery runs independently
          messageId,
          idempotencyKey: effectiveKey,
          logId: sendResult.logId,
          provider: 'Arkesel SMS Gateway',
          recipient: primaryRecipient,
          recipients: validRecipients,
          recipientCount: validRecipients.length,
          senderIdentity: sendResult.sender,
          costGHS: sendResult.costGHS,
          smsSegments,
          arkeselResponse: sendResult.rawResponse,
          providerResponse: `HTTP 200 OK | Arkesel accepted SMS submission for ${validRecipients.length} recipient${validRecipients.length > 1 ? 's' : ''} (${arkeselGatewayMs}ms)`,
          performance: {
            prepMs: prepTimeMs,
            arkeselGatewayMs,
            totalBackendMs,
            lifecycle: 'SUBMITTED'
          },
          timestamp: new Date().toISOString()
        };

        IDEMPOTENT_SMS_REGISTRY.set(effectiveKey, {
          idempotencyKey: effectiveKey,
          messageId,
          schoolId,
          recipient: primaryRecipient,
          status: 'submitted',
          result: responseData,
          createdAt: Date.now()
        });

        return res.status(200).json(responseData);
      } else {
        console.warn(`[SMS Perf] ID: ${messageId} | FAILED | Gateway: ${arkeselGatewayMs}ms | Total: ${totalBackendMs}ms | Error: ${sendResult.message}`);

        IDEMPOTENT_SMS_REGISTRY.set(effectiveKey, {
          idempotencyKey: effectiveKey,
          messageId,
          schoolId,
          recipient: primaryRecipient,
          status: 'failed',
          createdAt: Date.now()
        });

        return res.status(200).json({
          success: false,
          status: 'failed',
          messageId,
          idempotencyKey: effectiveKey,
          logId: sendResult.logId,
          provider: 'Arkesel SMS Gateway',
          recipient: primaryRecipient,
          recipients: validRecipients,
          recipientCount: validRecipients.length,
          senderIdentity: sendResult.sender,
          costGHS: sendResult.costGHS,
          error: sendResult.message,
          failureReason: sendResult.message,
          statusCode: sendResult.statusCode,
          arkeselResponse: sendResult.rawResponse,
          providerResponse: `HTTP ${sendResult.statusCode} Gateway Error: ${sendResult.message}`,
          performance: {
            prepMs: prepTimeMs,
            arkeselGatewayMs,
            totalBackendMs,
            lifecycle: 'FAILED'
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      const totalBackendMs = Number((performance.now() - reqStartTime).toFixed(1));
      return res.status(200).json({
        success: false,
        status: 'failed',
        error: `Server Execution Error: ${err?.message || 'Failed to dispatch SMS'}`,
        performance: { totalBackendMs, lifecycle: 'FAILED' }
      });
    }
  });

  // Dedicated High-Throughput Bulk SMS Dispatch Endpoint
  app.post('/api/communication/send-bulk-sms', async (req, res) => {
    const reqStartTime = performance.now();
    try {
      const {
        schoolId,
        schoolName,
        approvedSenderId,
        recipients,
        message,
        category,
        apiKey: clientProvidedKeySecret
      } = req.body || {};

      if (!schoolId) {
        return res.status(200).json({ success: false, status: 'failed', error: 'Multi-Tenant Error: schoolId is required' });
      }
      if (!Array.isArray(recipients) || recipients.length === 0 || !message) {
        return res.status(200).json({ success: false, status: 'failed', error: 'Recipients array and message body are required' });
      }

      const apiKey = (clientProvidedKeySecret || platformSmsConfig.apiKey || '').trim();
      if (!apiKey) {
        return res.status(200).json({ success: false, status: 'failed', error: 'SMS Gateway Not Configured.' });
      }
      if (!platformSmsConfig.isActive) {
        return res.status(200).json({ success: false, status: 'failed', error: 'Platform SMS Gateway is currently disabled.' });
      }

      // Filter and normalize all numbers
      const validNumbers: string[] = [];
      for (const r of recipients) {
        const p = normalizeGhanaPhoneNumber(r);
        if (p.isValid && p.formatted && !validNumbers.includes(p.formatted)) {
          validNumbers.push(p.formatted);
        }
      }

      if (validNumbers.length === 0) {
        return res.status(200).json({ success: false, status: 'no_phone', error: 'No valid Ghanaian numbers (+233) found in recipients list' });
      }

      const sender = sanitizeSenderId(approvedSenderId || schoolName || platformSmsConfig.senderId || 'SCHOOLOS');
      let finalMessage = String(message).trim();
      if (schoolName && !finalMessage.toLowerCase().includes(String(schoolName).toLowerCase())) {
        finalMessage = `${schoolName}: ${finalMessage}`;
      }

      // Batch in chunks of 100 for optimal gateway throughput
      const CHUNK_SIZE = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < validNumbers.length; i += CHUNK_SIZE) {
        chunks.push(validNumbers.slice(i, i + CHUNK_SIZE));
      }

      let totalSubmitted = 0;
      let totalCostGHS = 0;
      const batchResponses: any[] = [];

      // Concurrently submit chunks (up to 3 concurrent chunk requests to respect Arkesel rate limits)
      const submitChunk = async (chunkRecipients: string[]) => {
        const sendResult = await sendArkeselSMS({
          apiKey,
          apiUrl: platformSmsConfig.apiUrl,
          sender,
          recipients: chunkRecipients,
          message: finalMessage,
          schoolName
        });
        if (sendResult.success) {
          totalSubmitted += chunkRecipients.length;
          totalCostGHS += sendResult.costGHS;
        }
        batchResponses.push({
          recipientsCount: chunkRecipients.length,
          success: sendResult.success,
          message: sendResult.message
        });
      };

      // Process chunks in controlled batches of 3
      for (let i = 0; i < chunks.length; i += 3) {
        const currentBatch = chunks.slice(i, i + 3);
        await Promise.all(currentBatch.map(chunk => submitChunk(chunk)));
      }

      const totalBackendMs = Number((performance.now() - reqStartTime).toFixed(1));
      console.log(`[Bulk SMS Perf] Submitted: ${totalSubmitted}/${validNumbers.length} in ${totalBackendMs}ms across ${chunks.length} batch(es)`);

      return res.status(200).json({
        success: totalSubmitted > 0,
        status: totalSubmitted > 0 ? 'submitted' : 'failed',
        totalRecipients: validNumbers.length,
        submittedRecipients: totalSubmitted,
        failedRecipients: validNumbers.length - totalSubmitted,
        costGHS: Number(totalCostGHS.toFixed(2)),
        performance: { totalBackendMs, batchCount: chunks.length, lifecycle: 'SUBMITTED' },
        batchDetails: batchResponses,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      const totalBackendMs = Number((performance.now() - reqStartTime).toFixed(1));
      return res.status(200).json({
        success: false,
        status: 'failed',
        error: `Server Execution Error: ${err?.message || 'Failed to dispatch bulk SMS'}`,
        performance: { totalBackendMs, lifecycle: 'FAILED' }
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SchoolOS Full-Stack Server running on port ${PORT} with Paystack Subscriptions & Arkesel SMS Gateway`);
  });
}

startServer();

