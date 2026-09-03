import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { handleSendSms, handleTestSms, SendSmsRequest, TestSmsRequest } from './sms';
import { handleInitializePaystack, handleVerifyPaystack, InitializePaystackRequest } from './paystack';

admin.initializeApp();

const corsHandler = cors({ origin: true });

/**
 * Cloud Function to securely send SMS via Arkesel Gateway
 * Callable via HTTPS
 */
export const sendSms = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const data = req.body as SendSmsRequest;
      const result = await handleSendSms(data);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('[sendSms Cloud Function Error]:', err);
      res.status(200).json({
        success: false,
        message: err?.message || 'Internal Cloud Function Error',
        provider: 'arkesel',
        status: 'failed',
        statusCode: 500
      });
    }
  });
});

/**
 * Cloud Function to test Arkesel SMS Gateway connectivity
 * Callable via HTTPS
 */
export const testSms = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const data = req.body as TestSmsRequest;
      const result = await handleTestSms(data);
      res.status(200).json(result);
    } catch (err: any) {
      console.error('[testSms Cloud Function Error]:', err);
      res.status(200).json({
        success: false,
        statusCode: 500,
        provider: 'arkesel',
        message: err?.message || 'Internal Cloud Function Error',
        responsePayload: { error: err?.message || 'INTERNAL_ERROR' },
        timestamp: new Date().toISOString()
      });
    }
  });
});

/**
 * Cloud Function to initialize Paystack transaction
 */
export const initializePaystack = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const data = req.body as InitializePaystackRequest;
      const result = await handleInitializePaystack(data);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });
});

/**
 * Cloud Function to verify Paystack transaction
 */
export const verifyPaystack = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.status(405).json({ error: 'Method Not Allowed' });
      return;
    }

    try {
      const reference = (req.query.reference as string) || req.body?.reference;
      if (!reference) {
        res.status(400).json({ success: false, message: 'Reference is required' });
        return;
      }
      const result = await handleVerifyPaystack(reference);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });
});
