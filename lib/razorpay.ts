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
 *   RAZORPAY_WEBHOOK_SECRET  the secret typed into Dashboard → Webhooks
 *
 * Until the owner fills these in, isRazorpayConfigured() is false and the API
 * routes return a clean "not configured" 503 (COD keeps working).
 */

const RZP_API = "https://api.razorpay.com/v1";
const RZP_ORDERS_URL = `${RZP_API}/orders`;

export function getKeyId(): string {
  return (process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "").trim();
}

function getKeySecret(): string {
  return (process.env.RAZORPAY_KEY_SECRET ?? "").trim();
}

function getWebhookSecret(): string {
  return (process.env.RAZORPAY_WEBHOOK_SECRET ?? "").trim();
}

/** Both the key id and secret must be present for online payments to work. */
export function isRazorpayConfigured(): boolean {
  return getKeyId().length > 0 && getKeySecret().length > 0;
}

/** True once a webhook secret is set — the server-to-server safety net. */
export function isRazorpayWebhookConfigured(): boolean {
  return getWebhookSecret().length > 0;
}

/** Live keys move real money; test keys do not. Surfaced in the panel. */
export function isRazorpayLiveMode(): boolean {
  return getKeyId().startsWith("rzp_live");
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

/**
 * Verify a webhook delivery. Razorpay signs the RAW request body with the
 * WEBHOOK secret (a different secret from the API key secret) and sends the
 * digest in `x-razorpay-signature`. The body must be hashed exactly as
 * received — re-serialising the parsed JSON changes the bytes and the check
 * would never pass.
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = getWebhookSecret();
  if (!secret || !rawBody || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface RazorpayPayment {
  id: string;
  status?: string; // created | authorized | captured | refunded | failed
  order_id?: string;
  amount?: number; // paise
  method?: string; // upi | card | netbanking | wallet | emi | paylater
  error_description?: string;
  notes?: Record<string, string>;
}

/**
 * Every payment attempt made against a Razorpay order — the authoritative
 * answer to "did this customer actually pay?". Used to reconcile an order whose
 * browser-side verify never arrived and whose webhook wasn't set up yet.
 * Throws with a readable message so the panel can show why a check failed.
 */
export async function fetchRazorpayOrderPayments(razorpayOrderId: string): Promise<RazorpayPayment[]> {
  if (!isRazorpayConfigured()) {
    throw Object.assign(new Error("Razorpay is not configured"), { code: "RZP_NOT_CONFIGURED" });
  }
  const auth = Buffer.from(`${getKeyId()}:${getKeySecret()}`).toString("base64");
  const res = await fetch(`${RZP_API}/orders/${encodeURIComponent(razorpayOrderId)}/payments`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => null)) as
    | { items?: RazorpayPayment[]; error?: { description?: string } }
    | null;
  if (!res.ok) {
    throw new Error(data?.error?.description ?? `Razorpay lookup failed (${res.status})`);
  }
  return Array.isArray(data?.items) ? data.items : [];
}
