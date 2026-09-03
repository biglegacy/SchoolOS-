import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

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
const AUTHORITATIVE_TIER_PRICING: Record<string, { name: string; priceGHS: number; description: string }> = {
  plan_basic: { name: 'BASIC', priceGHS: 350, description: 'Essential academic and administrative core' },
  basic: { name: 'BASIC', priceGHS: 350, description: 'Essential academic and administrative core' },
  plan_standard: { name: 'STANDARD', priceGHS: 550, description: 'Expanded academic, examination & POS suite' },
  standard: { name: 'STANDARD', priceGHS: 550, description: 'Expanded academic, examination & POS suite' },
  plan_premium: { name: 'PREMIUM', priceGHS: 850, description: 'Complete enterprise suite with priority SMS' },
  premium: { name: 'PREMIUM', priceGHS: 850, description: 'Complete enterprise suite with priority SMS' },
};

// Helper: dispatch Arkesel SMS internally
async function sendArkeselSMSInternal(recipient: string, message: string, senderOverride?: string, schoolName?: string): Promise<{ success: boolean; error?: string; logId?: string }> {
  if (!platformSmsConfig.apiKey || !platformSmsConfig.isActive) {
    console.log('[Arkesel SMS Internal] Skipped (API Key not configured or disabled)');
    return { success: false, error: 'SMS Gateway inactive or missing API Key' };
  }

  const formattedRecipient = formatRecipientForArkesel(recipient);
  if (!formattedRecipient) return { success: false, error: 'Invalid recipient phone' };

  const sender = sanitizeSenderId(senderOverride || platformSmsConfig.senderId || 'SCHOOLOS');
  let finalMsg = message.trim();
  if (schoolName && !finalMsg.toLowerCase().includes(schoolName.toLowerCase())) {
    finalMsg = `[${schoolName}] ${finalMsg}`;
  }

  try {
    const response = await fetch(platformSmsConfig.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': platformSmsConfig.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: sender,
        message: finalMsg,
        recipients: [formattedRecipient]
      })
    });

    const isOk = response.ok;
    const logId = `COMM-SYS-${Date.now()}`;
    return { success: isOk, logId };
  } catch (err: any) {
    console.error('[Arkesel SMS Internal Error]:', err?.message);
    return { success: false, error: err?.message };
  }
}

// Clean and format recipient phone numbers for Ghana (e.g., 0244123456 -> 233244123456 or +233244123456)
function formatRecipientForArkesel(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `233${cleaned.slice(1)}`;
  }
  return cleaned;
}

// Sanitization of alphanumeric Sender ID (Arkesel accepts max 11 alphanumeric characters)
function sanitizeSenderId(senderId: string): string {
  if (!senderId) return 'SCHOOLOS';
  const cleaned = senderId.replace(/[^a-zA-Z0-9]/g, '').trim();
  return (cleaned.slice(0, 11) || 'SCHOOLOS').toUpperCase();
}

// Extract rich, descriptive user-facing error message from Arkesel responses
function extractArkeselErrorMessage(statusCode: number, rawJson: any, responseText: string): string {
  if (rawJson?.message) {
    let msg = typeof rawJson.message === 'string' ? rawJson.message : JSON.stringify(rawJson.message);
    if (rawJson.errors && typeof rawJson.errors === 'object') {
      const fieldErrors = Object.values(rawJson.errors).flat().join(', ');
      if (fieldErrors) msg += `: ${fieldErrors}`;
    }
    return msg;
  }
  if (rawJson?.error) {
    return typeof rawJson.error === 'string' ? rawJson.error : JSON.stringify(rawJson.error);
  }
  if (statusCode === 401 || statusCode === 403) {
    return 'Arkesel authentication failed. Invalid API Key or unregistered Sender ID.';
  }
  if (statusCode === 402) {
    return 'Insufficient SMS balance on Arkesel gateway account.';
  }
  if (statusCode === 422) {
    return 'Validation failed: Invalid recipient phone number or unregistered Sender ID.';
  }
  if (statusCode >= 500) {
    return `Arkesel Gateway service unavailable (HTTP ${statusCode}). Upstream gateway server failure.`;
  }
  if (!responseText || !responseText.trim()) {
    return `Arkesel Gateway returned empty response body (HTTP ${statusCode}).`;
  }
  return `Arkesel Gateway returned HTTP ${statusCode}`;
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
      if (apiUrl) platformSmsConfig.apiUrl = apiUrl.trim();
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

  // Test SMS Gateway with real Arkesel API request
  app.post('/api/communication/test-sms', async (req, res) => {
    const {
      apiKey: providedApiKey,
      apiUrl: providedApiUrl,
      senderId: providedSenderId,
      testRecipient,
      testMessage,
      schoolName
    } = req.body;

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

    if (!testRecipient || !testRecipient.trim()) {
      return res.status(200).json({
        success: false,
        statusCode: 400,
        provider: 'arkesel',
        message: 'Validation Error: Test recipient phone number is required.',
        responsePayload: { error: 'MISSING_RECIPIENT' },
        timestamp: new Date().toISOString()
      });
    }

    const formattedRecipient = formatRecipientForArkesel(testRecipient.trim());
    if (!formattedRecipient || formattedRecipient.length < 9) {
      return res.status(200).json({
        success: false,
        statusCode: 400,
        provider: 'arkesel',
        message: 'Validation Error: Invalid Ghanaian phone number format. Enter e.g. 0244123456 or 233244123456.',
        responsePayload: { error: 'INVALID_PHONE_NUMBER', raw: testRecipient },
        timestamp: new Date().toISOString()
      });
    }

    const messageContent = testMessage?.trim() || 
      `[${schoolName || 'SchoolOS'}] Central Arkesel SMS gateway connection test succeeded at ${new Date().toLocaleTimeString('en-GH')}.`;

    try {
      console.log(`[Arkesel SMS Test] Connecting to ${apiUrl} with Sender: "${sender}", Recipient: "${formattedRecipient}"...`);
      
      const payload = {
        sender: sender,
        message: messageContent,
        recipients: [formattedRecipient]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000)
      });

      const statusCode = response.status;
      const responseText = await response.text();
      let rawJson: any = null;

      try {
        rawJson = responseText && responseText.trim() ? JSON.parse(responseText) : null;
      } catch {
        rawJson = { rawResponse: responseText };
      }

      console.log(`[Arkesel SMS Test Raw Response] HTTP ${statusCode}:`, responseText ? responseText.slice(0, 500) : '<empty body>');

      // Evaluate success according to Arkesel API v2 specifications
      const isSuccess = response.ok && (
        rawJson?.status === 'success' ||
        rawJson?.code === 1000 ||
        rawJson?.code === 1001 ||
        rawJson?.status === 200 ||
        rawJson?.message?.toLowerCase()?.includes('success') ||
        rawJson?.message?.toLowerCase()?.includes('saved') ||
        rawJson?.data !== undefined
      );

      if (isSuccess) {
        return res.status(200).json({
          success: true,
          statusCode: statusCode || 200,
          provider: 'arkesel',
          message: `Arkesel Gateway Connected: SMS accepted by Arkesel and routed to ${formattedRecipient}.`,
          responsePayload: {
            status: 'success',
            arkeselResponse: rawJson,
            recipient: formattedRecipient,
            sender: sender,
            httpStatus: statusCode
          },
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMsg = extractArkeselErrorMessage(statusCode, rawJson, responseText);

        return res.status(200).json({
          success: false,
          statusCode: statusCode,
          provider: 'arkesel',
          message: errorMsg,
          responsePayload: {
            status: 'failed',
            arkeselResponse: rawJson || { rawBody: responseText },
            httpStatus: statusCode
          },
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('[Arkesel Gateway Network/Timeout Error]:', err);
      const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout') || err?.message?.includes('aborted');
      return res.status(200).json({
        success: false,
        statusCode: isTimeout ? 504 : 502,
        provider: 'arkesel',
        message: isTimeout
          ? 'Arkesel SMS Gateway connection timed out after 12 seconds. Upstream gateway did not respond in time.'
          : `Network Error: Could not connect to Arkesel SMS gateway: ${err?.message || 'Connection failed'}`,
        responsePayload: { error: err?.message || 'NETWORK_ERROR', isTimeout },
        timestamp: new Date().toISOString()
      });
    }
  });

  // Real Multi-Tenant SMS Dispatch Endpoint
  app.post('/api/communication/send-sms', async (req, res) => {
    const {
      schoolId,
      schoolName,
      approvedSenderId,
      recipient,
      recipientName,
      message,
      category,
      relatedRecordId,
      apiKey: clientProvidedKey
    } = req.body;

    if (!schoolId) {
      return res.status(200).json({ 
        success: false, 
        status: 'failed', 
        error: 'Multi-Tenant Error: schoolId is required' 
      });
    }

    if (!recipient || !message) {
      return res.status(200).json({ 
        success: false, 
        status: 'failed', 
        error: 'Recipient and message are required' 
      });
    }

    const apiKey = (clientProvidedKey || platformSmsConfig.apiKey || '').trim();
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

    const sender = sanitizeSenderId(approvedSenderId || schoolName || platformSmsConfig.senderId || 'SCHOOLOS');
    const formattedRecipient = formatRecipientForArkesel(recipient);
    const apiUrl = platformSmsConfig.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send';

    let finalMessage = message.trim();
    if (schoolName && !finalMessage.toLowerCase().includes(schoolName.toLowerCase())) {
      finalMessage = `${schoolName}: ${finalMessage}`;
    }

    const logId = `COMM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      console.log(`[Arkesel SMS Dispatch] Sending for "${schoolName || schoolId}" via Sender ID "${sender}" to "${formattedRecipient}"...`);

      const payload = {
        sender: sender,
        message: finalMessage,
        recipients: [formattedRecipient]
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(12000)
      });

      const statusCode = response.status;
      const responseText = await response.text();
      let rawJson: any = null;

      try {
        rawJson = responseText && responseText.trim() ? JSON.parse(responseText) : null;
      } catch {
        rawJson = { rawResponse: responseText };
      }

      console.log(`[Arkesel Dispatch Raw Response] HTTP ${statusCode}:`, responseText ? responseText.slice(0, 300) : '<empty body>');

      const isSuccess = response.ok && (
        rawJson?.status === 'success' ||
        rawJson?.code === 1000 ||
        rawJson?.code === 1001 ||
        rawJson?.status === 200 ||
        rawJson?.message?.toLowerCase()?.includes('success') ||
        rawJson?.message?.toLowerCase()?.includes('saved') ||
        rawJson?.data !== undefined
      );

      const cost = Number((Math.ceil(finalMessage.length / 160) * 0.04).toFixed(2));

      if (isSuccess) {
        return res.status(200).json({
          success: true,
          status: 'delivered',
          logId,
          provider: 'Arkesel SMS Gateway',
          recipient: formattedRecipient,
          senderIdentity: sender,
          costGHS: cost,
          arkeselResponse: rawJson,
          providerResponse: `HTTP ${statusCode} | ${JSON.stringify(rawJson)}`,
          timestamp: new Date().toISOString()
        });
      } else {
        const errorMsg = extractArkeselErrorMessage(statusCode, rawJson, responseText);
        return res.status(200).json({
          success: false,
          status: 'failed',
          logId,
          provider: 'Arkesel SMS Gateway',
          recipient: formattedRecipient,
          senderIdentity: sender,
          costGHS: cost,
          error: errorMsg,
          arkeselResponse: rawJson || { rawBody: responseText },
          providerResponse: `HTTP ${statusCode} Error: ${errorMsg}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('[Arkesel Dispatch Network/Timeout Failure]:', err);
      const isTimeout = err?.name === 'TimeoutError' || err?.message?.includes('timeout');
      return res.status(200).json({
        success: false,
        status: 'failed',
        logId,
        provider: 'Arkesel SMS Gateway',
        recipient: formattedRecipient,
        senderIdentity: sender,
        error: isTimeout ? 'Arkesel request timed out (12s)' : (err?.message || 'Network failure communicating with Arkesel API'),
        arkeselResponse: { error: err?.message || 'NETWORK_ERROR', isTimeout },
        timestamp: new Date().toISOString()
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

