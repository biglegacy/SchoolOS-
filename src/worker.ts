/**
 * Cloudflare Worker Entry Point for SchoolOS
 * Handles /api/* endpoints (SMS Gateway & Paystack Subscriptions) in Cloudflare Workers / Pages
 * Falls back to static assets via env.ASSETS for frontend client delivery.
 */

import { 
  sendArkeselSMS, 
  checkArkeselBalance, 
  sanitizeSenderId, 
  extractArkeselErrorMessage 
} from './lib/arkeselService';
import { normalizeGhanaPhoneNumber } from './lib/phoneNormalizer';

export interface Env {
  ARKESEL_API_KEY?: string;
  ARKESEL_API_SECRET?: string;
  ARKESEL_SENDER_ID?: string;
  ARKESEL_API_URL?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

// In-memory runtime cache for dynamically updated platform configuration in Worker
let runtimeSmsConfig = {
  provider: 'arkesel',
  apiKey: '',
  apiSecret: '',
  apiUrl: 'https://sms.arkesel.com/api/v2/sms/send',
  senderId: 'SCHOOLOS',
  isActive: true
};

// Worker Idempotency Map for duplicate suppression
const IDEMPOTENT_WORKER_SMS_REGISTRY = new Map<string, {
  status: 'processing' | 'accepted' | 'delivered' | 'failed';
  messageId: string;
  result?: any;
  createdAt: number;
}>();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, api-key, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // 1. Handle CORS preflight for all endpoints
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    // Resolve active Arkesel API key from env or runtime cache
    const effectiveApiKey = (env.ARKESEL_API_KEY || runtimeSmsConfig.apiKey || '').trim();
    const effectiveApiUrl = (env.ARKESEL_API_URL || runtimeSmsConfig.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send').trim();
    const effectiveSenderId = (env.ARKESEL_SENDER_ID || runtimeSmsConfig.senderId || 'SCHOOLOS').trim();

    // 2. Health check
    if (url.pathname === '/api/health') {
      return jsonResponse({
        status: 'ok',
        runtime: 'Cloudflare Worker',
        timestamp: new Date().toISOString(),
        hasSmsKey: Boolean(effectiveApiKey)
      });
    }

    // 3. Central Communication Status (Never reveals unmasked secrets)
    if (url.pathname === '/api/communication/status' && method === 'GET') {
      return jsonResponse({
        provider: 'arkesel',
        isActive: runtimeSmsConfig.isActive,
        hasApiKey: Boolean(effectiveApiKey),
        apiKeyMasked: effectiveApiKey 
          ? `${effectiveApiKey.slice(0, 4)}••••••••${effectiveApiKey.slice(-3)}` 
          : null,
        apiUrl: effectiveApiUrl,
        senderId: effectiveSenderId
      });
    }

    // 4. Update Central Communication Config
    if (url.pathname === '/api/communication/config' && method === 'POST') {
      try {
        const body: any = await request.json();
        if (body.apiKey !== undefined) runtimeSmsConfig.apiKey = body.apiKey.trim();
        if (body.apiSecret !== undefined) runtimeSmsConfig.apiSecret = body.apiSecret.trim();
        if (body.apiUrl) {
          runtimeSmsConfig.apiUrl = body.apiUrl.includes('hubtel') ? 'https://sms.arkesel.com/api/v2/sms/send' : body.apiUrl.trim();
        }
        if (body.senderId) runtimeSmsConfig.senderId = body.senderId.trim();
        if (body.isActive !== undefined) runtimeSmsConfig.isActive = Boolean(body.isActive);

        return jsonResponse({
          success: true,
          message: 'Central SMS Gateway credentials saved securely in Cloudflare runtime.',
          hasApiKey: Boolean(runtimeSmsConfig.apiKey || env.ARKESEL_API_KEY)
        });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err?.message || 'Invalid JSON body' }, 400);
      }
    }

    // 5. Dedicated Arkesel Balance Check (GET & POST)
    if (url.pathname === '/api/communication/balance' && (method === 'GET' || method === 'POST')) {
      try {
        let body: any = {};
        if (method === 'POST') {
          try { body = await request.json(); } catch { body = {}; }
        }
        const apiKey = (body.apiKey || url.searchParams.get('apiKey') || effectiveApiKey).trim();
        const apiUrl = (body.apiUrl || url.searchParams.get('apiUrl') || 'https://sms.arkesel.com/api/v2/clients/balance-details').trim();

        if (!apiKey) {
          return jsonResponse({
            success: false,
            statusCode: 400,
            error: 'Arkesel API Key is not configured. Please configure it in Super Admin platform settings.'
          });
        }

        const balanceResult = await checkArkeselBalance(apiKey, apiUrl);
        return jsonResponse({
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
        return jsonResponse({
          success: false,
          statusCode: 500,
          error: `Worker Balance Error: ${err?.message || 'Failed to retrieve balance'}`
        });
      }
    }

    // 5b. Test Arkesel API Key / Balance endpoint (GET https://sms.arkesel.com/api/v2/clients/balance-details)
    if (url.pathname === '/api/communication/test-key' && method === 'POST') {
      try {
        let body: any = {};
        try { body = await request.json(); } catch { body = {}; }

        const apiKey = (body.apiKey || effectiveApiKey).trim();
        if (!apiKey) {
          return jsonResponse({
            success: false,
            statusCode: 400,
            provider: 'arkesel',
            message: 'Validation Error: Arkesel API Key is required. Please configure it in Super Admin platform settings.',
            responsePayload: { error: 'MISSING_API_KEY' },
            timestamp: new Date().toISOString()
          });
        }

        const balanceResult = await checkArkeselBalance(apiKey);
        return jsonResponse({
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
        return jsonResponse({
          success: false,
          statusCode: 500,
          provider: 'arkesel',
          message: `Internal Worker Error: ${err?.message || 'Failed to verify Arkesel key'}`,
          responsePayload: { error: err?.message },
          timestamp: new Date().toISOString()
        });
      }
    }

    // 6. Test SMS Gateway with live Arkesel API request
    if (url.pathname === '/api/communication/test-sms' && method === 'POST') {
      try {
        const body: any = await request.json();
        const apiKey = (body.apiKey || effectiveApiKey).trim();
        const apiUrl = (body.apiUrl || effectiveApiUrl).trim();
        const sender = sanitizeSenderId(body.senderId || effectiveSenderId);
        const testRecipient = body.testRecipient;
        const testMessage = body.testMessage;
        const schoolName = body.schoolName || 'SchoolOS Platform';

        if (!apiKey) {
          return jsonResponse({
            success: false,
            statusCode: 400,
            provider: 'arkesel',
            message: 'Validation Error: Arkesel API Key is required. Please enter your Arkesel API key in platform settings.',
            responsePayload: { error: 'MISSING_API_KEY' },
            timestamp: new Date().toISOString()
          });
        }

        if (!testRecipient || typeof testRecipient !== 'string' || !testRecipient.trim()) {
          return jsonResponse({
            success: false,
            statusCode: 400,
            provider: 'arkesel',
            message: 'Validation Error: Test recipient phone number is required.',
            responsePayload: { error: 'MISSING_RECIPIENT' },
            timestamp: new Date().toISOString()
          });
        }

        const phoneResult = normalizeGhanaPhoneNumber(testRecipient);
        if (!phoneResult.isValid || !phoneResult.formatted) {
          return jsonResponse({
            success: false,
            statusCode: 400,
            provider: 'arkesel',
            message: `Validation Error: ${phoneResult.error || 'Invalid Ghanaian phone number format.'}`,
            responsePayload: { error: 'INVALID_PHONE_NUMBER', raw: testRecipient },
            timestamp: new Date().toISOString()
          });
        }

        const formattedRecipient = phoneResult.formatted;
        const messageContent = testMessage?.trim() ||
          `[${schoolName}] Central Arkesel SMS gateway connection test succeeded at ${new Date().toLocaleTimeString('en-GH')}.`;

        const sendResult = await sendArkeselSMS({
          apiKey,
          apiUrl,
          sender,
          recipient: formattedRecipient,
          message: messageContent,
          schoolName
        });

        return jsonResponse({
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
        return jsonResponse({
          success: false,
          statusCode: 500,
          provider: 'arkesel',
          message: `Worker Execution Error: ${err?.message || 'Failed to dispatch test SMS'}`,
          responsePayload: { error: err?.message },
          timestamp: new Date().toISOString()
        });
      }
    }

    // 7. Multi-Tenant Send SMS Endpoint with Idempotency Protection
    if (url.pathname === '/api/communication/send-sms' && method === 'POST') {
      try {
        const body: any = await request.json();
        const {
          schoolId,
          schoolName,
          approvedSenderId,
          recipient,
          recipientName,
          message,
          category,
          relatedRecordId,
          idempotencyKey: clientProvidedKey,
          messageId: clientMessageId,
          apiKey: clientProvidedKeySecret
        } = body;

        if (!schoolId) {
          return jsonResponse({
            success: false,
            status: 'failed',
            error: 'Multi-Tenant Error: schoolId is required'
          }, 400);
        }

        if (!recipient || !message) {
          return jsonResponse({
            success: false,
            status: 'failed',
            error: 'Recipient phone number and message body are required'
          }, 400);
        }

        const apiKey = (clientProvidedKeySecret || effectiveApiKey).trim();
        if (!apiKey) {
          return jsonResponse({
            success: false,
            status: 'failed',
            error: 'SMS Gateway Not Configured. The Super Admin has not yet configured the Arkesel API key in platform settings.'
          });
        }

        if (!runtimeSmsConfig.isActive) {
          return jsonResponse({
            success: false,
            status: 'disabled',
            error: 'SMS Gateway is currently disabled in Super Admin Platform Settings.'
          });
        }

        const phoneResult = normalizeGhanaPhoneNumber(recipient);
        if (!phoneResult.isValid || !phoneResult.formatted) {
          return jsonResponse({
            success: false,
            status: 'no_phone',
            error: `Invalid Ghanaian Phone Number: ${phoneResult.error || 'Must be a valid Ghanaian number formatted with +233.'}`
          });
        }

        const formattedRecipient = phoneResult.formatted;
        const sender = sanitizeSenderId(approvedSenderId, undefined, approvedSenderId);

        let finalMessage = String(message).trim();
        if (schoolName && !finalMessage.toLowerCase().includes(String(schoolName).toLowerCase())) {
          finalMessage = `${schoolName}: ${finalMessage}`;
        }

        // Idempotency check
        const effectiveKey = clientProvidedKey || `sms_${schoolId}_${category || 'notif'}_${relatedRecordId || ''}_${formattedRecipient}`;
        const existing = IDEMPOTENT_WORKER_SMS_REGISTRY.get(effectiveKey);
        if (existing) {
          if (existing.status === 'processing') {
            return jsonResponse({
              success: true,
              status: 'accepted',
              messageId: existing.messageId,
              idempotencyKey: effectiveKey,
              duplicateSuppressed: true,
              providerResponse: 'SMS is currently in-flight and accepted by gateway (Duplicate Suppressed)',
              timestamp: new Date().toISOString()
            });
          }
          if (existing.status === 'accepted' || existing.status === 'delivered') {
            return jsonResponse({
              ...existing.result,
              duplicateSuppressed: true
            });
          }
        }

        const messageId = clientMessageId || `MSG-${Date.now()}`;
        IDEMPOTENT_WORKER_SMS_REGISTRY.set(effectiveKey, {
          status: 'processing',
          messageId,
          createdAt: Date.now()
        });

        const charCount = finalMessage.length;
        const smsSegments = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

        const sendResult = await sendArkeselSMS({
          apiKey,
          apiUrl: effectiveApiUrl,
          sender,
          recipient: formattedRecipient,
          message: finalMessage,
          schoolName
        });

        if (sendResult.success) {
          const responseData = {
            success: true,
            status: 'accepted',
            messageId,
            idempotencyKey: effectiveKey,
            logId: sendResult.logId,
            costGHS: sendResult.costGHS,
            smsSegments,
            providerResponse: `HTTP 200 OK | Arkesel SMS accepted for ${formattedRecipient} (${smsSegments} segment${smsSegments > 1 ? 's' : ''})`,
            provider: 'Arkesel SMS Gateway',
            recipient: formattedRecipient,
            sender,
            arkeselResponse: sendResult.rawResponse,
            timestamp: new Date().toISOString()
          };

          IDEMPOTENT_WORKER_SMS_REGISTRY.set(effectiveKey, {
            status: 'accepted',
            messageId,
            result: responseData,
            createdAt: Date.now()
          });

          return jsonResponse(responseData);
        } else {
          IDEMPOTENT_WORKER_SMS_REGISTRY.set(effectiveKey, {
            status: 'failed',
            messageId,
            createdAt: Date.now()
          });

          return jsonResponse({
            success: false,
            status: 'failed',
            messageId,
            idempotencyKey: effectiveKey,
            logId: sendResult.logId,
            costGHS: sendResult.costGHS,
            error: sendResult.message,
            failureReason: sendResult.message,
            provider: 'Arkesel SMS Gateway',
            recipient: formattedRecipient,
            sender,
            statusCode: sendResult.statusCode,
            arkeselResponse: sendResult.rawResponse,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err: any) {
        return jsonResponse({
          success: false,
          status: 'failed',
          error: `Worker Execution Failure: ${err?.message || 'Unknown internal error'}`
        }, 500);
      }
    }

    // 8. Paystack subscription / transaction endpoints can be proxied or handled if needed
    if (url.pathname.startsWith('/api/paystack/')) {
      return jsonResponse({
        success: true,
        message: 'Paystack proxy handler active in worker'
      });
    }

    // 9. Pass through to Static Assets (Vite Client SPA)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  }
};
