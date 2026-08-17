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
exports.initializePaymentController = initializePaymentController;
exports.getPaymentController = getPaymentController;
exports.paystackWebhookController = paystackWebhookController;
const crypto = __importStar(require("crypto"));
const payments_repository_1 = require("./payments.repository");
const payments_service_1 = require("./payments.service");
async function initializePaymentController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        const email = req.user.email;
        const amount = 50000;
        const reference = `TODO_${Date.now()}_${crypto
            .randomBytes(4)
            .toString("hex")}`;
        const payment = await (0, payments_repository_1.createPayment)(userId, reference, amount, "NGN");
        const paystackTransaction = await (0, payments_service_1.initializePaystackTransaction)(email, amount, reference);
        return res.status(201).json({
            message: "Payment initialized successfully.",
            payment: {
                id: payment.id,
                reference: payment.reference,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
            },
            paystack: {
                authorization_url: paystackTransaction?.authorization_url,
                access_code: paystackTransaction?.access_code,
                reference: paystackTransaction?.reference,
            },
        });
    }
    catch (error) {
        console.error("Payment initialization failed:", error);
        return res.status(500).json({
            message: "Something went wrong while initializing payment.",
        });
    }
}
async function getPaymentController(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const { reference } = req.params;
        if (!reference) {
            return res.status(400).json({
                message: "Payment reference is required.",
            });
        }
        const payment = await (0, payments_repository_1.findPaymentByReferenceForUser)(reference, req.user.userId);
        if (!payment) {
            return res.status(404).json({
                message: "Payment not found.",
            });
        }
        return res.status(200).json({
            payment,
        });
    }
    catch (error) {
        console.error("Fetching payment failed:", error);
        return res.status(500).json({
            message: "Something went wrong while fetching payment.",
        });
    }
}
async function paystackWebhookController(req, res) {
    try {
        console.log("Received Paystack webhook.");
        const signature = req.headers["x-paystack-signature"];
        if (!signature ||
            typeof signature !== "string") {
            return res.status(401).json({
                message: "Missing Paystack signature.",
            });
        }
        const rawBody = req.body;
        if (!Buffer.isBuffer(rawBody)) {
            console.error("Webhook body is not a Buffer.");
            return res.status(400).json({
                message: "Invalid webhook body.",
            });
        }
        const isValid = (0, payments_service_1.verifyPaystackSignature)(rawBody, signature);
        if (!isValid) {
            console.error("Invalid Paystack webhook signature.");
            return res.status(401).json({
                message: "Invalid Paystack signature.",
            });
        }
        console.log("Paystack signature verified.");
        const event = JSON.parse(rawBody.toString("utf8"));
        console.log("Paystack event:", event.event);
        if (event.event !== "charge.success") {
            console.log("Ignoring Paystack event:", event.event);
            return res.status(200).json({
                received: true,
            });
        }
        const reference = event.data?.reference;
        if (!reference) {
            console.error("Paystack webhook has no reference.");
            return res.status(400).json({
                message: "Payment reference missing.",
            });
        }
        console.log("Payment reference:", reference);
        const payment = await (0, payments_repository_1.findPaymentByReference)(reference);
        if (!payment) {
            console.error("Payment not found:", reference);
            return res.status(200).json({
                received: true,
            });
        }
        if (payment.status === "SUCCESS") {
            console.log("Payment already processed:", reference);
            return res.status(200).json({
                received: true,
                message: "Payment already processed.",
            });
        }
        if (Number(event.data.amount) !==
            Number(payment.amount)) {
            console.error("Payment amount mismatch.", {
                reference,
                expected: payment.amount,
                received: event.data.amount,
            });
            return res.status(400).json({
                message: "Payment amount does not match.",
            });
        }
        if (event.data.currency !==
            payment.currency) {
            console.error("Payment currency mismatch.", {
                reference,
                expected: payment.currency,
                received: event.data.currency,
            });
            return res.status(400).json({
                message: "Payment currency does not match.",
            });
        }
        const updatedPayment = await (0, payments_repository_1.updatePaymentStatus)(reference, "SUCCESS");
        console.log("Payment marked SUCCESS:", updatedPayment);
        return res.status(200).json({
            received: true,
        });
    }
    catch (error) {
        console.error("Paystack webhook failed:", error);
        return res.status(500).json({
            message: "Webhook processing failed.",
        });
    }
}
