"use client";

/**
 * COD (Cash on Delivery) order submission.
 * Posts to the same-origin Next.js API route /api/cod, which:
 *  1. saves the FULL order (products, varieties, quantities, offer, totals)
 *     into the local panel database `orders` table (server-side priced), and
 *  2. mirrors the lead into the CRM `enquiry` table (best-effort).
 * Same origin → no CORS, no loopback, no PHP.
 */
export const COD_API_URL =
  process.env.NEXT_PUBLIC_COD_API ?? "/api/cod";

export interface CodOrderItem {
  product: string; // product slug: slimpax | diasuddhi | joshveda
  quantity: number;
  /** Chosen variety / pack option label (if the product has variants). */
  variant?: string;
}

export interface CodOrderPayload {
  name: string;
  mobile: string;
  address: string;
  state: string;
  city?: string;
  pincode?: string;
  email?: string;
  /** Applied offer / coupon code — validated again on the server. */
  coupon?: string;
  paymentMethod?: string;
  items: CodOrderItem[];
}

export interface CodOrderResult {
  success: boolean;
  message: string;
  orderNumber?: string;
  total?: number;
  inserted?: number;
  crmSynced?: boolean;
  localSaved?: boolean;
  ip?: string;
  /** Set when a COD rule refused the order: over the value cap, or still in the cooldown. */
  codBlocked?: "amount" | "cooldown";
  /** Minutes to wait before COD is available again (cooldown refusals). */
  retryAfterMinutes?: number;
  /** The configured COD value cap in ₹ (amount refusals). */
  maxOrderValue?: number;
}

/** COD availability for the signed-in customer, as the server sees it. */
export interface CodEligibility {
  allowed: boolean;
  /** Why COD is unavailable, ready to show (null when it is available). */
  reason: string | null;
  retryAfterMinutes: number;
  maxOrderValue: number;
  cooldownMinutes: number;
}

/**
 * Ask whether this customer may pay by COD right now (the once-an-hour rule).
 * Purely for the UI — the same check runs again when the order is submitted, so
 * a failure here simply leaves COD on offer rather than blocking checkout.
 */
export async function fetchCodEligibility(): Promise<CodEligibility | null> {
  try {
    const res = await fetch(COD_API_URL, { method: "GET", cache: "no-store" });
    const data = (await res.json()) as Partial<CodEligibility> & { success?: boolean };
    if (!data || typeof data.allowed !== "boolean") return null;
    return {
      allowed: data.allowed,
      reason: data.reason ?? null,
      retryAfterMinutes: Number(data.retryAfterMinutes ?? 0),
      maxOrderValue: Number(data.maxOrderValue ?? 0),
      cooldownMinutes: Number(data.cooldownMinutes ?? 0),
    };
  } catch {
    return null;
  }
}

/** POST a COD order. Throws on network/HTTP failure. */
export async function submitCodOrder(payload: CodOrderPayload): Promise<CodOrderResult> {
  const res = await fetch(COD_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: CodOrderResult | null = null;
  try {
    data = (await res.json()) as CodOrderResult;
  } catch {
    /* non-JSON response */
  }

  // The API returns a JSON { success, message } body even for business-rule
  // failures (422 validation, "no valid products", DB error). Surface those to
  // the UI via codRes.message instead of throwing — only throw when there is no
  // usable JSON body (a true network/transport error or a bodyless response).
  if (data && typeof data.success === "boolean") {
    return data;
  }
  throw new Error(data?.message ?? `COD request failed (${res.status})`);
}
