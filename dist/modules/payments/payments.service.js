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
exports.initializePaystackTransaction = initializePaystackTransaction;
exports.verifyPaystackWebhook = verifyPaystackWebhook;
exports.verifyPaystackSignature = verifyPaystackSignature;
const crypto = __importStar(require("crypto"));
const PAYSTACK_BASE_URL = "https://api.paystack.co";
function getPaystackSecretKey() {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
        throw new Error("PAYSTACK_SECRET_KEY is not configured.");
    }
    return key;
}
async function initializePaystackTransaction(email, amount, reference) {
    const secretKey = getPaystackSecretKey();
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email,
            amount,
            reference,
            currency: "NGN",
        }),
    });
    const data = await response.json();
    if (!response.ok || !data?.status) {
        console.error("Paystack initialization failed:", data);
        throw new Error(data.message || "Failed to initialize Paystack transaction.");
    }
    return data.data;
}
function verifyPaystackWebhook(payload, signature) {
    const secretKey = getPaystackSecretKey();
    const hash = crypto
        .createHmac("sha512", secretKey)
        .update(payload)
        .digest("hex");
    return hash === signature;
}
function verifyPaystackSignature(rawBody, signature) {
    const secretKey = getPaystackSecretKey();
    const hash = crypto
        .createHmac("sha512", secretKey)
        .update(rawBody)
        .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
