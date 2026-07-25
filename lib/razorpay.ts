import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay server helpers — zero external dependency.
 * ---------------------------------------------------------------------------
 * We talk to Razorpay's REST API with `fetch` (Basic auth) and verify the
 * payment signature with Node's crypto (HMAC-SHA256), exactly as the official
 * SDK does — so no new package is added to the project.
 *
 * Env (server-only secret + a public key id the browser also needs):
 *   RAZORPAY_KEY_ID          e.g. rzp_test_xxx / rzp_live_xxx
 *   RAZORPAY_KEY_SECRET      the secret (NEVER sent to the browser)
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID   same value as RAZORPAY_KEY_ID, exposed to the client
 *
 * Until the owner fills these in, isRazorpayConfigured() is false and the API
 * routes return a clean "not configured" 503 (COD keeps working).
 */

const RZP_ORDERS_URL = "https://api.razorpay.com/v1/orders";

export function getKeyId(): string {
  return (process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").trim();
}

function getKeySecret(): string {
  return (process.env.RAZORPAY_KEY_SECRET ?? "").trim();
}

/** Both the key id and secret must be present for online payments to work. */
export function isRazorpayConfigured(): boolean {
  return getKeyId().length > 0 && getKeySecret().length > 0;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // in paise
  currency: string;
  receipt?: string;
  status?: string;
}

/**
 * Create a Razorpay order for `amountPaise` (integer paise). The amount is
 * computed on the server from the priced cart — the browser never supplies it.
 */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string> = {},
  currency = "INR"
): Promise<RazorpayOrder> {
  if (!isRazorpayConfigured()) {
    throw Object.assign(new Error("Razorpay is not configured"), { code: "RZP_NOT_CONFIGURED" });
  }
  const amount = Math.max(100, Math.round(amountPaise)); // Razorpay minimum is ₹1 (100 paise)
  const auth = Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString("base64");

  const res = await fetch(RZP_ORDERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency,
      receipt: receipt.slice(0, 40),
      notes,
      payment_capture: 1,
    }),
    // Never cache a payment-order creation.
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as
    | (RazorpayOrder & { error?: { description?: string } })
    | null;

  if (!res.ok || !data?.id) {
    const msg = data?.error?.description ?? `Razorpay order creation failed (${res.status})`;
    throw Object.assign(new Error(msg), { code: "RZP_ORDER_FAILED", status: res.status });
  }
  return { id: data.id, amount: data.amount, currency: data.currency, receipt: data.receipt, status: data.status };
}

/**
 * Verify the checkout callback signature. Razorpay signs
 * `${razorpay_order_id}|${razorpay_payment_id}` with HMAC-SHA256(key_secret).
 * Constant-time comparison avoids timing leaks.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  const secret = getKeySecret();
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
