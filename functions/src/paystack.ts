import * as admin from 'firebase-admin';

export interface InitializePaystackRequest {
  email: string;
  amountInGHS: number;
  schoolId: string;
  planId?: string;
  billingCycle?: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export async function handleInitializePaystack(reqData: InitializePaystackRequest) {
  const db = admin.firestore();
  let secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    const paystackDoc = await db.collection('platformSettings').doc('paystack').get();
    if (paystackDoc.exists) {
      secretKey = paystackDoc.data()?.secretKey;
    }
  }

  if (!secretKey) {
    return {
      success: false,
      message: 'Paystack Secret Key is not configured in platform settings.'
    };
  }

  const amountKobo = Math.round(reqData.amountInGHS * 100);
  const reference = `REF-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: reqData.email,
        amount: amountKobo,
        currency: 'GHS',
        reference: reference,
        callback_url: reqData.callbackUrl,
        metadata: {
          ...reqData.metadata,
          schoolId: reqData.schoolId,
          planId: reqData.planId,
          billingCycle: reqData.billingCycle
        }
      }),
      signal: AbortSignal.timeout(12000)
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = { raw: responseText };
    }

    if (response.ok && data?.status) {
      return {
        success: true,
        reference: reference,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code
      };
    } else {
      return {
        success: false,
        message: data?.message || `Paystack initialization failed (HTTP ${response.status})`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to Paystack: ${err?.message || 'Connection failed'}`
    };
  }
}

export async function handleVerifyPaystack(reference: string) {
  const db = admin.firestore();
  let secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    const paystackDoc = await db.collection('platformSettings').doc('paystack').get();
    if (paystackDoc.exists) {
      secretKey = paystackDoc.data()?.secretKey;
    }
  }

  if (!secretKey) {
    return {
      success: false,
      message: 'Paystack Secret Key is not configured.'
    };
  }

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(12000)
    });

    const responseText = await response.text();
    let data: any = null;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = { raw: responseText };
    }

    if (response.ok && data?.status && data.data.status === 'success') {
      const meta = data.data.metadata || {};
      const schoolId = meta.schoolId;

      if (schoolId) {
        // Record subscription transaction in Firestore
        const txDoc = {
          id: `tx_${reference}`,
          schoolId: schoolId,
          reference: reference,
          amountGHS: data.data.amount / 100,
          currency: 'GHS',
          status: 'success',
          paidAt: data.data.paid_at || new Date().toISOString(),
          customerEmail: data.data.customer?.email,
          channel: data.data.channel,
          createdAt: new Date().toISOString()
        };

        await db.collection('subscriptionTransactions').doc(txDoc.id).set(txDoc, { merge: true });
      }

      return {
        success: true,
        status: 'success',
        transaction: data.data
      };
    } else {
      return {
        success: false,
        status: data?.data?.status || 'failed',
        message: data?.message || 'Transaction verification failed'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error verifying Paystack transaction: ${err?.message || 'Verification error'}`
    };
  }
}
