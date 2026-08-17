import * as crypto from "crypto";
import { createPayment, updatePaymentStatus, findPaymentByReference, findPaymentByReferenceForUser } from "./payments.repository";
import { initializePaystackTransaction, verifyPaystackSignature, } from "./payments.service";
// ======================================================
// INITIALIZE PAYMENT
// POST /payments/initialize
// ======================================================
export async function initializePaymentController(req, res) {
    try {
        // 1. Make sure user is authenticated
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required.",
            });
        }
        const userId = req.user.userId;
        const email = req.user.email;
        // Amount in kobo
        // ₦500 = 50,000 kobo
        const amount = 50000;
        // Generate unique payment reference
        const reference = `TODO_${Date.now()}_${crypto
            .randomBytes(4)
            .toString("hex")}`;
        // 2. Create local payment
        const payment = await createPayment(userId, reference, amount, "NGN");
        // 3. Initialize transaction with Paystack
        const paystackTransaction = await initializePaystackTransaction(email, amount, reference);
        // 4. Return payment information
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
                authorization_url: paystackTransaction.authorization_url,
                access_code: paystackTransaction.access_code,
                reference: paystackTransaction.reference,
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
export async function getPaymentController(req, res) {
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
        const payment = await findPaymentByReferenceForUser(reference, req.user.userId);
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
// ======================================================
// PAYSTACK WEBHOOK
// POST /payments/webhook
// ======================================================
export async function paystackWebhookController(req, res) {
    try {
        console.log("Received Paystack webhook.");
        // --------------------------------------------------
        // 1. Get Paystack signature
        // --------------------------------------------------
        const signature = req.headers["x-paystack-signature"];
        if (!signature ||
            typeof signature !== "string") {
            return res.status(401).json({
                message: "Missing Paystack signature.",
            });
        }
        // --------------------------------------------------
        // 2. Get RAW request body
        // --------------------------------------------------
        const rawBody = req.body;
        if (!Buffer.isBuffer(rawBody)) {
            console.error("Webhook body is not a Buffer.");
            return res.status(400).json({
                message: "Invalid webhook body.",
            });
        }
        // --------------------------------------------------
        // 3. Verify Paystack signature
        // --------------------------------------------------
        const isValid = verifyPaystackSignature(rawBody, signature);
        if (!isValid) {
            console.error("Invalid Paystack webhook signature.");
            return res.status(401).json({
                message: "Invalid Paystack signature.",
            });
        }
        console.log("Paystack signature verified.");
        // --------------------------------------------------
        // 4. Parse webhook JSON
        // --------------------------------------------------
        const event = JSON.parse(rawBody.toString("utf8"));
        console.log("Paystack event:", event.event);
        // --------------------------------------------------
        // 5. We only process successful payments
        // --------------------------------------------------
        if (event.event !== "charge.success") {
            console.log("Ignoring Paystack event:", event.event);
            return res.status(200).json({
                received: true,
            });
        }
        // --------------------------------------------------
        // 6. Get payment reference
        // --------------------------------------------------
        const reference = event.data?.reference;
        if (!reference) {
            console.error("Paystack webhook has no reference.");
            return res.status(400).json({
                message: "Payment reference missing.",
            });
        }
        console.log("Payment reference:", reference);
        // --------------------------------------------------
        // 7. Find our local payment
        // --------------------------------------------------
        const payment = await findPaymentByReference(reference);
        if (!payment) {
            console.error("Payment not found:", reference);
            // Tell Paystack we received it.
            return res.status(200).json({
                received: true,
            });
        }
        // --------------------------------------------------
        // 8. Prevent duplicate processing
        // --------------------------------------------------
        if (payment.status === "SUCCESS") {
            console.log("Payment already processed:", reference);
            return res.status(200).json({
                received: true,
                message: "Payment already processed.",
            });
        }
        // --------------------------------------------------
        // 9. Verify amount
        // --------------------------------------------------
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
        // --------------------------------------------------
        // 10. Verify currency
        // --------------------------------------------------
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
        // --------------------------------------------------
        // 11. Mark payment SUCCESS
        // --------------------------------------------------
        const updatedPayment = await updatePaymentStatus(reference, "SUCCESS");
        console.log("Payment marked SUCCESS:", updatedPayment);
        // --------------------------------------------------
        // 12. Tell Paystack everything worked
        // --------------------------------------------------
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
