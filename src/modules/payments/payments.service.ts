
import * as crypto from "crypto";


const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getPaystackSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;

  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  return key;
}


export async function initializePaystackTransaction(
  email: string,
  amount: number,
  reference: string
) {
  const secretKey = getPaystackSecretKey();

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
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
    }
  );

  const data = await response.json() as { status: boolean; message?: string; data?: unknown };

  if (!response.ok || !data?.status) {
    console.error("Paystack initialization failed:", data);

    throw new Error(
      data.message || "Failed to initialize Paystack transaction."
    );
  }

  return data.data;
}



export function verifyPaystackWebhook(
  payload: string,
  signature: string
) {
  const secretKey = getPaystackSecretKey();

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(payload)
    .digest("hex");

  return hash === signature;
}



export function verifyPaystackSignature(
  rawBody: Buffer,
  signature: string
) {
  const secretKey = getPaystackSecretKey();

  const hash = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}