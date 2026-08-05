"use client";

/**
 * Razorpay client service.
 * Talks to our own same-origin API (which is server-authoritative on price),
 * loads the Razorpay Checkout script on demand, and opens the payment modal.
 */

export const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** True when the public key id is present — used to show/hide the online option. */
export function isRazorpayEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}

export interface RazorpayLineItem {
  product: string; // slug
  quantity: number;
  variant?: string;
}

export interface RazorpayOrderPayload {
  name: string;
  mobile: string;
  email?: string;
  address: string;
  city?: string;
  state: string;
  pincode?: string;
  coupon?: string;
  items: RazorpayLineItem[];
}

/** Methods we can pre-select inside Razorpay's modal via `prefill.method`. */
export type RazorpayPreferredMethod = "upi" | "card" | "netbanking" | "wallet";

export interface RazorpayOrderResult {
  success: boolean;
  message?: string;
  keyId?: string;
  razorpayOrderId?: string;
  amount?: number; // paise
  currency?: string;
  orderNumber?: string;
  internalOrderId?: string;
  total?: number; // rupees
  prefill?: { name?: string; email?: string; contact?: string };
}

export interface RazorpayVerifyPayload {
  internalOrderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayVerifyResult {
  success: boolean;
  message?: string;
  orderNumber?: string;
  total?: number;
}

/** Minimal shape of the checkout success handler response from Razorpay. */
export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (res: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string; method?: RazorpayPreferredMethod };
  notes?: Record<string, string>;
  theme?: { color?: string };
  /** Let the customer retry inside the modal instead of restarting checkout. */
  retry?: { enabled: boolean; max_count?: number };
  /** Remember the payer's saved cards/UPI ids for a faster next checkout. */
  remember_customer?: boolean;
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean };
}

/** Shape of the `payment.failed` event Razorpay emits for a declined attempt. */
export interface RazorpayFailure {
  code?: string;
  description?: string;
  reason?: string;
  step?: string;
  method?: string;
  paymentId?: string;
}

interface RazorpayFailedEvent {
  error?: {
    code?: string;
    description?: string;
    reason?: string;
    step?: string;
    metadata?: { payment_id?: string; order_id?: string };
  };
  method?: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (res: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/** Inject the Razorpay Checkout script once; resolves true when ready. */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Create a server-priced Razorpay order. */
export async function createRazorpayOrder(
  payload: RazorpayOrderPayload
): Promise<RazorpayOrderResult> {
  const res = await fetch("/api/razorpay/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as RazorpayOrderResult | null;
  if (data && typeof data.success === "boolean") return data;
  return { success: false, message: `Could not start payment (${res.status})` };
}

/** Verify a completed payment on the server. */
export async function verifyRazorpayPayment(
  payload: RazorpayVerifyPayload
): Promise<RazorpayVerifyResult> {
  const res = await fetch("/api/razorpay/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => null)) as RazorpayVerifyResult | null;
  if (data && typeof data.success === "boolean") return data;
  return { success: false, message: `Verification failed (${res.status})` };
}

/**
 * Open the Razorpay checkout modal for an already-created order.
 *
 * Every method the account has enabled (UPI — intent, collect & QR — cards,
 * netbanking, wallets, EMI, pay-later) is offered: we deliberately do NOT pass
 * a `method` filter, so what the customer sees is exactly what is switched on
 * in the Razorpay dashboard.
 *
 * Resolves with the handler response on success, or null if the customer
 * dismissed the modal. A DECLINED attempt is reported through `onFailed` —
 * Razorpay keeps the modal open for a retry, so a failure is not an end state.
 */
export function openRazorpayCheckout(opts: {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  brand: string;
  description?: string;
  logo?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  /** Opens Razorpay with this tab already selected (customer can still switch). */
  preferredMethod?: RazorpayPreferredMethod | null;
  themeColor?: string;
  onFailed?: (failure: RazorpayFailure) => void;
}): Promise<RazorpayHandlerResponse | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.Razorpay) return resolve(null);
    let settled = false;
    const rzp = new window.Razorpay({
      key: opts.keyId,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.brand,
      description: opts.description,
      image: opts.logo,
      order_id: opts.razorpayOrderId,
      prefill: {
        ...opts.prefill,
        ...(opts.preferredMethod ? { method: opts.preferredMethod } : {}),
      },
      // Deliberately NO `notes` here: the Razorpay order already carries
      // { orderId, orderNumber } set server-side, and checkout-level notes can
      // overwrite them — which is exactly what the webhook reads to find the
      // order when the browser never reports back.
      theme: { color: opts.themeColor ?? "#5b8c6e" },
      retry: { enabled: true, max_count: 4 },
      remember_customer: true,
      handler: (res) => {
        settled = true;
        resolve(res);
      },
      modal: {
        // A stray tap outside the modal mid-UPI shouldn't kill the payment.
        confirm_close: true,
        ondismiss: () => {
          if (!settled) resolve(null);
        },
      },
    });

    // Declined card / failed UPI mandate / expired collect request — surface the
    // real reason instead of a generic "payment failed" once the modal closes.
    rzp.on("payment.failed", (res) => {
      const evt = res as RazorpayFailedEvent;
      opts.onFailed?.({
        code: evt.error?.code,
        description: evt.error?.description,
        reason: evt.error?.reason,
        step: evt.error?.step,
        method: evt.method,
        paymentId: evt.error?.metadata?.payment_id,
      });
    });

    rzp.open();
  });
}
