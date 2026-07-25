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
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
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
 * Resolves with the handler response on success, or null if the user dismisses.
 */
export function openRazorpayCheckout(opts: {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  brand: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  themeColor?: string;
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
      order_id: opts.razorpayOrderId,
      prefill: opts.prefill,
      theme: { color: opts.themeColor ?? "#5b8c6e" },
      handler: (res) => {
        settled = true;
        resolve(res);
      },
      modal: {
        ondismiss: () => {
          if (!settled) resolve(null);
        },
      },
    });
    rzp.open();
  });
}
