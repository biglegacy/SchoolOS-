"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInitializePaystack = handleInitializePaystack;
exports.handleVerifyPaystack = handleVerifyPaystack;
const admin = __importStar(require("firebase-admin"));
async function handleInitializePaystack(reqData) {
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
        let data = null;
        try {
            data = responseText ? JSON.parse(responseText) : null;
        }
        catch {
            data = { raw: responseText };
        }
        if (response.ok && data?.status) {
            return {
                success: true,
                reference: reference,
                authorizationUrl: data.data.authorization_url,
                accessCode: data.data.access_code
            };
        }
        else {
            return {
                success: false,
                message: data?.message || `Paystack initialization failed (HTTP ${response.status})`
            };
        }
    }
    catch (err) {
        return {
            success: false,
            message: `Network error connecting to Paystack: ${err?.message || 'Connection failed'}`
        };
    }
}
async function handleVerifyPaystack(reference) {
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
        let data = null;
        try {
            data = responseText ? JSON.parse(responseText) : null;
        }
        catch {
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
        }
        else {
            return {
                success: false,
                status: data?.data?.status || 'failed',
                message: data?.message || 'Transaction verification failed'
            };
        }
    }
    catch (err) {
        return {
            success: false,
            message: `Network error verifying Paystack transaction: ${err?.message || 'Verification error'}`
        };
    }
}
//# sourceMappingURL=paystack.js.map