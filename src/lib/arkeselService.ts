/**
 * Authoritative Arkesel SMS Gateway Service for SchoolOS
 * Unified backend logic for Cloudflare Workers, Cloudflare Pages, and Node.js Express server.
 *
 * Arkesel SMS API v2 Specifications:
 * - SMS Dispatch: POST https://sms.arkesel.com/api/v2/sms/send
 * - Balance/Auth Validation: GET https://sms.arkesel.com/api/v2/clients/balance-details
 * - Headers:
 *   - api-key: string
 *   - Content-Type: application/json (for POST)
 *   - Accept: application/json
 * - Body:
 *   - sender: string (max 11 alphanumeric characters)
 *   - message: string
 *   - recipients: string[] (all normalized to E.164 +233XXXXXXXXX)
 */

import { normalizeGhanaPhoneNumber } from './phoneNormalizer';

export interface ArkeselSendParams {
  apiKey: string;
  apiUrl?: string;
  sender?: string;
  recipient?: string;
  recipients?: string[];
  message: string;
  schoolName?: string;
}

export interface ArkeselSendResult {
  success: boolean;
  statusCode: number;
  status?: 'submitted' | 'accepted' | 'failed';
  message: string;
  recipient: string;
  recipients?: string[];
  recipientCount?: number;
  sender: string;
  logId: string;
  costGHS: number;
  gatewayLatencyMs?: number;
  rawResponse?: any;
  arkeselData?: any;
  errorDetails?: string;
}

export interface ArkeselBalanceResult {
  success: boolean;
  statusCode: number;
  message: string;
  balance?: number | string;
  mainBalance?: number | string;
  rawResponse?: any;
  error?: string;
}

const DEFAULT_ARKESEL_SMS_URL = 'https://sms.arkesel.com/api/v2/sms/send';
const DEFAULT_ARKESEL_BALANCE_URL = 'https://sms.arkesel.com/api/v2/clients/balance-details';
const DEFAULT_SENDER_ID = 'SCHOOLOS';
const REQUEST_TIMEOUT_MS = 8000; // 8 seconds responsive timeout prevents blocking while allowing gateway turnaround

/**
 * Strips accidental prefixes (such as 'Bearer ', 'api-key:', quotes) from an Arkesel API key
 */
export function cleanArkeselApiKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey
    .replace(/^bearer\s+/i, '')
    .replace(/^api[-_]key:\s*/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}

/**
 * Sanitizes alphanumeric Sender ID according to Ghanaian NCA and Arkesel telecom regulations.
 * Rule: Maximum 11 characters, uppercase alphanumeric only, no special characters or spaces.
 */
export function sanitizeSenderId(
  senderName?: string,
  shortCode?: string,
  approvedSenderId?: string
): string {
  if (approvedSenderId && approvedSenderId.trim()) {
    const cleaned = approvedSenderId.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 11);
    }
  }

  if (shortCode && shortCode.trim()) {
    const cleaned = shortCode.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 11);
    }
  }

  if (!senderName || !senderName.trim()) {
    return DEFAULT_SENDER_ID;
  }

  const alphanumeric = senderName.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
  if (alphanumeric.length >= 3) {
    return alphanumeric.slice(0, 11);
  }

  return DEFAULT_SENDER_ID;
}

/**
 * Extracts a descriptive, actionable user-facing error message from an Arkesel HTTP response
 */
export function extractArkeselErrorMessage(
  statusCode: number,
  rawJson: any,
  responseText: string
): string {
  // Check HTTP 405 specifically
  if (statusCode === 405) {
    return 'Arkesel rejected the HTTP method used by the request (HTTP 405). The Arkesel SMS v2 endpoint requires POST with JSON body.';
  }

  if (statusCode === 401 || statusCode === 403) {
    return 'Arkesel authentication failed (HTTP ' + statusCode + '). Invalid or inactive API Key. Please verify your Arkesel API key in platform settings.';
  }

  if (statusCode === 402) {
    return 'Insufficient SMS balance on Arkesel account (HTTP 402). Please top up your Arkesel SMS units.';
  }

  if (statusCode === 429) {
    return 'Arkesel rate limit or quota exceeded (HTTP 429). Please wait before sending more messages.';
  }

  if (statusCode === 504 || statusCode === 408) {
    return 'Arkesel SMS Gateway connection timed out (HTTP 504). Upstream Arkesel servers did not respond in time.';
  }

  if (statusCode >= 500) {
    return `Arkesel Gateway service unavailable (HTTP ${statusCode}). Upstream Arkesel server failure.`;
  }

  // Inspect JSON response structure
  if (rawJson && typeof rawJson === 'object') {
    const jsonMsg = (
      rawJson.message ||
      rawJson.error ||
      rawJson.errorMessage ||
      rawJson.description ||
      (rawJson.errors ? (Array.isArray(rawJson.errors) ? rawJson.errors.join(', ') : JSON.stringify(rawJson.errors)) : '')
    );

    if (jsonMsg && typeof jsonMsg === 'string') {
      const lower = jsonMsg.toLowerCase();
      if (lower.includes('sender') && (lower.includes('not approved') || lower.includes('not registered') || lower.includes('unregistered') || lower.includes('invalid') || lower.includes('whitelist'))) {
        return `Arkesel rejected Sender ID: "${jsonMsg}". Your Sender ID must be registered and approved by Arkesel and NCA before live SMS delivery.`;
      }
      if (lower.includes('balance') || lower.includes('credit') || lower.includes('insufficient') || lower.includes('units')) {
        return `Insufficient SMS balance on Arkesel gateway: ${jsonMsg}`;
      }
      if (lower.includes('unauthenticated') || lower.includes('invalid api') || lower.includes('unauthorized') || lower.includes('api key')) {
        return `Arkesel API Key authentication failed: ${jsonMsg}`;
      }
      if (lower.includes('recipient') || lower.includes('phone') || lower.includes('number')) {
        return `Invalid recipient phone number according to Arkesel: ${jsonMsg}`;
      }
      if (lower.includes('method') || lower.includes('not allowed')) {
        return `Arkesel rejected the HTTP method used by the request: ${jsonMsg}`;
      }
      return `Arkesel Gateway Error (HTTP ${statusCode}): ${jsonMsg}`;
    }
  }

  if (!responseText || !responseText.trim()) {
    return `Arkesel Gateway returned an empty response body (HTTP ${statusCode}).`;
  }

  const cleanSnippet = responseText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
  return `Arkesel Gateway returned HTTP ${statusCode}: ${cleanSnippet || 'Unrecognized response format'}`;
}

/**
 * Validates an Arkesel API key and checks current SMS balance
 * Calls GET https://sms.arkesel.com/api/v2/clients/balance-details
 */
export async function checkArkeselBalance(
  apiKey: string,
  apiUrl: string = DEFAULT_ARKESEL_BALANCE_URL
): Promise<ArkeselBalanceResult> {
  const trimmedKey = cleanArkeselApiKey(apiKey);
  if (!trimmedKey) {
    return {
      success: false,
      statusCode: 400,
      message: 'Validation Error: Arkesel API Key is required.',
      error: 'MISSING_API_KEY'
    };
  }

  const endpoint = (!apiUrl || apiUrl.includes('hubtel')) ? DEFAULT_ARKESEL_BALANCE_URL : apiUrl.trim();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'api-key': trimmedKey,
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    const statusCode = response.status;
    const responseText = await response.text();
    let rawJson: any = null;

    try {
      rawJson = responseText && responseText.trim() ? JSON.parse(responseText) : null;
    } catch {
      rawJson = { rawResponse: responseText };
    }

    const isSuccess = response.ok && (
      rawJson?.status === 'success' ||
      rawJson?.code === 1000 ||
      rawJson?.data !== undefined ||
      rawJson?.balance !== undefined ||
      rawJson?.sms_balance !== undefined
    );

    if (isSuccess) {
      const data = rawJson?.data || rawJson;
      const smsBalance = data?.sms_balance ?? data?.balance ?? 'Active';
      const mainBalance = data?.main_balance ?? data?.account_balance;

      return {
        success: true,
        statusCode,
        message: `Arkesel API Key Valid. SMS Balance: ${smsBalance}${mainBalance !== undefined ? ` (Main: GHS ${mainBalance})` : ''}`,
        balance: smsBalance,
        mainBalance: mainBalance,
        rawResponse: rawJson
      };
    }

    const errorMsg = extractArkeselErrorMessage(statusCode, rawJson, responseText);
    return {
      success: false,
      statusCode,
      message: errorMsg,
      rawResponse: rawJson || { rawBody: responseText },
      error: 'ARKESEL_BALANCE_ERROR'
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError' || err?.message?.includes('timeout');
    return {
      success: false,
      statusCode: isTimeout ? 504 : 502,
      message: isTimeout
        ? 'Arkesel API Key verification timed out after 12 seconds. Upstream Arkesel server did not respond.'
        : `Network Error: Could not connect to Arkesel API (${err?.message || 'Connection failed'}).`,
      error: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR'
    };
  }
}

/**
 * Dispatches an SMS via Arkesel v2 API
 * Calls POST https://sms.arkesel.com/api/v2/sms/send
 */
export async function sendArkeselSMS(params: ArkeselSendParams): Promise<ArkeselSendResult> {
  const { apiKey, apiUrl, sender, recipient, recipients: rawRecipients, message, schoolName } = params;
  const logId = `COMM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  // 1. Validate API Key
  const trimmedKey = cleanArkeselApiKey(apiKey);
  if (!trimmedKey) {
    return {
      success: false,
      statusCode: 400,
      status: 'failed',
      message: 'Validation Error: Arkesel API Key is required. Please configure it in Super Admin platform settings.',
      recipient: recipient || '',
      sender: sender || DEFAULT_SENDER_ID,
      logId,
      costGHS: 0,
      errorDetails: 'MISSING_API_KEY'
    };
  }

  // 2. Normalize Ghanaian Phone Numbers to international +233 format
  const recipientList: string[] = [];
  if (Array.isArray(rawRecipients) && rawRecipients.length > 0) {
    for (const r of rawRecipients) {
      if (r && typeof r === 'string' && r.trim()) {
        const norm = normalizeGhanaPhoneNumber(r);
        if (norm.isValid && norm.formatted) {
          recipientList.push(norm.formatted);
        }
      }
    }
  } else if (recipient) {
    const norm = normalizeGhanaPhoneNumber(recipient);
    if (norm.isValid && norm.formatted) {
      recipientList.push(norm.formatted);
    }
  }

  if (recipientList.length === 0) {
    return {
      success: false,
      statusCode: 400,
      status: 'failed',
      message: 'Validation Error: At least one valid Ghanaian recipient phone number (+233) is required.',
      recipient: recipient || '',
      sender: sender || DEFAULT_SENDER_ID,
      logId,
      costGHS: 0,
      errorDetails: 'INVALID_PHONE_NUMBER'
    };
  }

  const primaryRecipient = recipientList[0];

  // 3. Validate and sanitize message and sender ID
  const finalMessage = (message || '').trim();
  if (!finalMessage) {
    return {
      success: false,
      statusCode: 400,
      status: 'failed',
      message: 'Validation Error: Message body cannot be empty.',
      recipient: primaryRecipient,
      sender: sender || DEFAULT_SENDER_ID,
      logId,
      costGHS: 0,
      errorDetails: 'EMPTY_MESSAGE'
    };
  }

  const finalSender = sanitizeSenderId(sender || schoolName || DEFAULT_SENDER_ID);
  const targetUrl = (!apiUrl || apiUrl.includes('hubtel')) ? DEFAULT_ARKESEL_SMS_URL : apiUrl.trim();

  // 4. Calculate SMS cost in GH₵ (0.04 GHS per 160-character segment per recipient)
  const smsSegments = Math.ceil(finalMessage.length / 160) || 1;
  const costGHS = Number((smsSegments * 0.04 * recipientList.length).toFixed(2));

  // 5. Construct valid Arkesel v2 JSON payload
  const payload = {
    sender: finalSender,
    message: finalMessage,
    recipients: recipientList
  };

  const gatewayStartTime = performance.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Make strict POST request with correct headers
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'api-key': trimmedKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timer);

    const gatewayLatencyMs = Math.round(performance.now() - gatewayStartTime);
    const statusCode = response.status;
    const responseText = await response.text();
    let rawJson: any = null;

    try {
      rawJson = responseText && responseText.trim() ? JSON.parse(responseText) : null;
    } catch {
      rawJson = { rawResponse: responseText };
    }

    // Evaluate success according to Arkesel v2 specifications
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
      return {
        success: true,
        statusCode: statusCode || 200,
        status: 'submitted', // Accepted by Arkesel gateway; carrier delivery proceeds independently
        message: `Arkesel Gateway Connected: SMS accepted by Arkesel (${gatewayLatencyMs}ms) and queued for carrier delivery to ${recipientList.length} recipient${recipientList.length > 1 ? 's' : ''}.`,
        recipient: primaryRecipient,
        recipients: recipientList,
        recipientCount: recipientList.length,
        sender: finalSender,
        logId,
        costGHS,
        gatewayLatencyMs,
        rawResponse: rawJson,
        arkeselData: rawJson?.data
      };
    }

    const errorMsg = extractArkeselErrorMessage(statusCode, rawJson, responseText);
    return {
      success: false,
      statusCode,
      status: 'failed',
      message: errorMsg,
      recipient: primaryRecipient,
      recipients: recipientList,
      recipientCount: recipientList.length,
      sender: finalSender,
      logId,
      costGHS,
      gatewayLatencyMs,
      rawResponse: rawJson || { rawBody: responseText },
      errorDetails: errorMsg
    };
  } catch (err: any) {
    const gatewayLatencyMs = Math.round(performance.now() - gatewayStartTime);
    const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError' || err?.message?.includes('timeout');
    const errorMsg = isTimeout
      ? `Arkesel SMS Gateway connection timed out after ${(REQUEST_TIMEOUT_MS / 1000).toFixed(0)}s. Upstream gateway did not respond in time.`
      : `Network Error: Could not connect to Arkesel SMS gateway: ${err?.message || 'Connection failed'}`;

    return {
      success: false,
      statusCode: isTimeout ? 504 : 502,
      status: 'failed',
      message: errorMsg,
      recipient: primaryRecipient,
      recipients: recipientList,
      recipientCount: recipientList.length,
      sender: finalSender,
      logId,
      costGHS,
      gatewayLatencyMs,
      rawResponse: { error: err?.message || 'NETWORK_ERROR', isTimeout },
      errorDetails: errorMsg
    };
  }
}
