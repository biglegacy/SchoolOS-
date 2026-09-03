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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPaystack = exports.initializePaystack = exports.testSms = exports.sendSms = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const cors_1 = __importDefault(require("cors"));
const sms_1 = require("./sms");
const paystack_1 = require("./paystack");
admin.initializeApp();
const corsHandler = (0, cors_1.default)({ origin: true });
/**
 * Cloud Function to securely send SMS via Arkesel Gateway
 * Callable via HTTPS
 */
exports.sendSms = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        try {
            const data = req.body;
            const result = await (0, sms_1.handleSendSms)(data);
            res.status(200).json(result);
        }
        catch (err) {
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
exports.testSms = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        try {
            const data = req.body;
            const result = await (0, sms_1.handleTestSms)(data);
            res.status(200).json(result);
        }
        catch (err) {
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
exports.initializePaystack = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        try {
            const data = req.body;
            const result = await (0, paystack_1.handleInitializePaystack)(data);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ success: false, message: err?.message });
        }
    });
});
/**
 * Cloud Function to verify Paystack transaction
 */
exports.verifyPaystack = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method !== 'GET' && req.method !== 'POST') {
            res.status(405).json({ error: 'Method Not Allowed' });
            return;
        }
        try {
            const reference = req.query.reference || req.body?.reference;
            if (!reference) {
                res.status(400).json({ success: false, message: 'Reference is required' });
                return;
            }
            const result = await (0, paystack_1.handleVerifyPaystack)(reference);
            res.status(200).json(result);
        }
        catch (err) {
            res.status(500).json({ success: false, message: err?.message });
        }
    });
});
//# sourceMappingURL=index.js.map