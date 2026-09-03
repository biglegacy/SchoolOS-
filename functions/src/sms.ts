import * as admin from 'firebase-admin';

export interface SendSmsRequest {
  schoolId: string;
  recipient: string;
  message: string;
  sender?: string;
  recipientName?: string;
  category?: string;
  relatedRecordId?: string;
  academicYear?: string;
  term?: string;
  createdBy?: string;
  apiKey?: string;
}

export interface SmsResult {
  success: boolean;
  message: string;
  provider: 'arkesel';
  status?: string;
  statusCode?: number;
  logId?: string;
  costGHS?: number;
  arkeselResponse?: any;
}

export interface TestSmsRequest {
  apiKey?: string;
  apiUrl?: string;
  senderId?: string;
  testRecipient: string;
  testMessage?: string;
  schoolName?: string;
}

export interface TestSmsResult {
  success: boolean;
  statusCode: number;
  provider: 'arkesel';
  message: string;
  responsePayload: Record<string, any>;
  timestamp: string;
}

function formatGhanaianRecipient(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-()+]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '233' + cleaned.substring(1);
  }
  if (cleaned.startsWith('233') && (cleaned.length === 12 || cleaned.length === 13)) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }
  return cleaned;
}

function sanitizeSenderId(sender?: string): string {
  if (!sender) return 'SCHOOLOS';
  const clean = sender.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
  return clean.slice(0, 11) || 'SCHOOLOS';
}

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

/**
 * Cloud Function core implementation for sending SMS via Arkesel Gateway
 */
export async function handleSendSms(data: SendSmsRequest): Promise<SmsResult> {
  const db = admin.firestore();
  const logId = `COMM-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const now = new Date().toISOString();

  // 1. Validate required fields
  if (!data.schoolId) {
    return {
      success: false,
      message: 'Multi-Tenant Validation Error: schoolId is required.',
      provider: 'arkesel',
      status: 'failed',
      statusCode: 400
    };
  }

  if (!data.recipient || !data.recipient.trim()) {
    return {
      success: false,
      message: 'Validation Error: Recipient phone number is required.',
      provider: 'arkesel',
      status: 'failed',
      statusCode: 400
    };
  }

  if (!data.message || !data.message.trim()) {
    return {
      success: false,
      message: 'Validation Error: SMS message content is required.',
      provider: 'arkesel',
      status: 'failed',
      statusCode: 400
    };
  }

  // 2. Fetch Central SMS Settings from Firestore if not passed
  let apiKey = (data.apiKey || process.env.ARKESEL_API_KEY || '').trim();
  let apiUrl = 'https://sms.arkesel.com/api/v2/sms/send';
  let defaultSenderId = 'SCHOOLOS';

  if (!apiKey) {
    try {
      const commDoc = await db.collection('platformSettings').doc('communication').get();
      if (commDoc.exists) {
        const commData = commDoc.data();
        if (commData?.sms) {
          apiKey = (commData.sms.apiKey || '').trim();
          if (commData.sms.apiUrl) apiUrl = commData.sms.apiUrl.trim();
          if (commData.sms.senderId) defaultSenderId = commData.sms.senderId.trim();
        }
      }
    } catch (err) {
      console.warn('[handleSendSms] Could not read platformSettings from Firestore:', err);
    }
  }

  if (!apiKey) {
    return {
      success: false,
      message: 'Arkesel Gateway Error: Arkesel API key is not configured in Super Admin platform settings.',
      provider: 'arkesel',
      status: 'failed',
      statusCode: 400
    };
  }

  const formattedRecipient = formatGhanaianRecipient(data.recipient.trim());
  const sender = sanitizeSenderId(data.sender || defaultSenderId);
  const finalMessage = data.message.trim();
  const costGHS = Number((Math.ceil(finalMessage.length / 160) * 0.04).toFixed(2));

  try {
    console.log(`[Arkesel Cloud Function] Sending to ${formattedRecipient} with Sender: ${sender}`);

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
    let arkeselResponse: any = null;

    try {
      arkeselResponse = responseText && responseText.trim() ? JSON.parse(responseText) : null;
    } catch {
      arkeselResponse = { rawResponse: responseText };
    }

    console.log(`[Arkesel Raw Gateway Response] HTTP ${statusCode}:`, responseText ? responseText.slice(0, 500) : '<empty>');

    const isSuccess = response.ok && (
      arkeselResponse?.status === 'success' ||
      arkeselResponse?.code === 1000 ||
      arkeselResponse?.code === 1001 ||
      arkeselResponse?.status === 200 ||
      arkeselResponse?.message?.toLowerCase()?.includes('success') ||
      arkeselResponse?.message?.toLowerCase()?.includes('saved') ||
      arkeselResponse?.data !== undefined
    );

    const docStatus = isSuccess ? 'delivered' : 'failed';

    // 3. Persist to Firestore: smsMessages and communicationLogs
    try {
      const smsRecord = {
        id: logId,
        schoolId: data.schoolId,
        recipient: formattedRecipient,
        sender: sender,
        message: finalMessage,
        status: docStatus,
        costGHS: costGHS,
        arkeselResponse: arkeselResponse,
        createdAt: now,
        createdBy: data.createdBy || 'system',
        academicYear: data.academicYear || '2025/2026',
        term: data.term || 'Term 1'
      };

      const commLogRecord = {
        id: logId,
        schoolId: data.schoolId,
        schoolName: data.sender || 'SchoolOS',
        type: 'sms',
        recipient: formattedRecipient,
        recipientName: data.recipientName || 'Guardian',
        senderName: data.sender || 'SchoolOS',
        senderIdentity: sender,
        provider: 'Arkesel SMS Gateway',
        status: docStatus,
        message: finalMessage,
        category: data.category || 'general',
        relatedRecordId: data.relatedRecordId || undefined,
        costGHS: costGHS,
        timestamp: now,
        providerResponse: `HTTP ${statusCode} | ${JSON.stringify(arkeselResponse)}`
      };

      await Promise.all([
        db.collection('smsMessages').doc(logId).set(smsRecord),
        db.collection('communicationLogs').doc(logId).set(commLogRecord)
      ]);
    } catch (persistErr) {
      console.error('[handleSendSms] Firestore persistence error:', persistErr);
    }

    if (isSuccess) {
      return {
        success: true,
        message: 'SMS sent successfully',
        provider: 'arkesel',
        status: 'delivered',
        statusCode: statusCode || 200,
        logId: logId,
        costGHS: costGHS,
        arkeselResponse: arkeselResponse
      };
    } else {
      const userFriendlyMessage = extractArkeselErrorMessage(statusCode, arkeselResponse, responseText);

      return {
        success: false,
        message: userFriendlyMessage,
        provider: 'arkesel',
        status: 'failed',
        statusCode: statusCode,
        logId: logId,
        costGHS: costGHS,
        arkeselResponse: arkeselResponse
      };
    }
  } catch (netErr: any) {
    console.error('[handleSendSms Network Error]:', netErr);
    const isTimeout = netErr?.name === 'TimeoutError' || netErr?.message?.includes('timeout') || netErr?.message?.includes('aborted');
    const errMsg = isTimeout
      ? 'Arkesel SMS gateway connection timed out after 12 seconds. Upstream gateway did not respond in time.'
      : `Network error connecting to Arkesel SMS gateway: ${netErr?.message || 'Connection failed'}`;

    return {
      success: false,
      message: errMsg,
      provider: 'arkesel',
      status: 'failed',
      statusCode: isTimeout ? 504 : 502,
      logId: logId,
      arkeselResponse: { error: netErr?.message || 'NETWORK_ERROR', isTimeout }
    };
  }
}

/**
 * Cloud Function core implementation for testing Arkesel Gateway connectivity
 */
export async function handleTestSms(data: TestSmsRequest): Promise<TestSmsResult> {
  const db = admin.firestore();
  const now = new Date().toISOString();

  let apiKey = (data.apiKey || process.env.ARKESEL_API_KEY || '').trim();
  let apiUrl = (data.apiUrl || 'https://sms.arkesel.com/api/v2/sms/send').trim();
  let defaultSenderId = 'SCHOOLOS';

  if (!apiKey) {
    try {
      const commDoc = await db.collection('platformSettings').doc('communication').get();
      if (commDoc.exists) {
        const commData = commDoc.data();
        if (commData?.sms) {
          apiKey = (commData.sms.apiKey || '').trim();
          if (commData.sms.apiUrl) apiUrl = commData.sms.apiUrl.trim();
          if (commData.sms.senderId) defaultSenderId = commData.sms.senderId.trim();
        }
      }
    } catch (err) {
      console.warn('[handleTestSms] Could not read platformSettings from Firestore:', err);
    }
  }

  if (!apiKey) {
    return {
      success: false,
      statusCode: 400,
      provider: 'arkesel',
      message: 'Validation Error: Arkesel API Key is required. Please configure it in Super Admin platform settings.',
      responsePayload: { error: 'MISSING_API_KEY' },
      timestamp: now
    };
  }

  if (!data.testRecipient || !data.testRecipient.trim()) {
    return {
      success: false,
      statusCode: 400,
      provider: 'arkesel',
      message: 'Validation Error: Test recipient phone number is required.',
      responsePayload: { error: 'MISSING_RECIPIENT' },
      timestamp: now
    };
  }

  const formattedRecipient = formatGhanaianRecipient(data.testRecipient.trim());
  if (!formattedRecipient || formattedRecipient.length < 9) {
    return {
      success: false,
      statusCode: 400,
      provider: 'arkesel',
      message: 'Validation Error: Invalid Ghanaian phone number format. Enter e.g. 0244123456 or 233244123456.',
      responsePayload: { error: 'INVALID_PHONE_NUMBER', raw: data.testRecipient },
      timestamp: now
    };
  }

  const sender = sanitizeSenderId(data.senderId || defaultSenderId);
  const messageContent = data.testMessage?.trim() || 
    `[${data.schoolName || 'SchoolOS'}] Central Arkesel SMS gateway connection test succeeded at ${new Date().toLocaleTimeString('en-GH')}.`;

  try {
    console.log(`[Arkesel Cloud Function Test] Connecting to ${apiUrl} with Sender: "${sender}", Recipient: "${formattedRecipient}"...`);
    
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

    console.log(`[Arkesel Cloud Function Test Raw Response] HTTP ${statusCode}:`, responseText ? responseText.slice(0, 500) : '<empty body>');

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
        provider: 'arkesel',
        message: `Arkesel Gateway Connected: SMS accepted by Arkesel and routed to ${formattedRecipient}.`,
        responsePayload: {
          status: 'success',
          arkeselResponse: rawJson,
          recipient: formattedRecipient,
          sender: sender,
          httpStatus: statusCode
        },
        timestamp: now
      };
    } else {
      const errorMsg = extractArkeselErrorMessage(statusCode, rawJson, responseText);
      return {
        success: false,
        statusCode: statusCode,
        provider: 'arkesel',
        message: errorMsg,
        responsePayload: {
          status: 'failed',
          arkeselResponse: rawJson || { rawBody: responseText },
          httpStatus: statusCode
        },
        timestamp: now
      };
    }
  } catch (netErr: any) {
    console.error('[Arkesel Cloud Function Test Network Error]:', netErr);
    const isTimeout = netErr?.name === 'TimeoutError' || netErr?.message?.includes('timeout') || netErr?.message?.includes('aborted');
    return {
      success: false,
      statusCode: isTimeout ? 504 : 502,
      provider: 'arkesel',
      message: isTimeout
        ? 'Arkesel SMS Gateway connection timed out after 12 seconds. Upstream gateway did not respond in time.'
        : `Network error connecting to Arkesel SMS gateway: ${netErr?.message || 'Connection failed'}`,
      responsePayload: { error: netErr?.message || 'NETWORK_ERROR', isTimeout },
      timestamp: now
    };
  }
}
