import type { SiteConfig } from "@/types";

/**
 * Prepaid (pay-online) discount — ONE implementation, shared by the browser and
 * the server.
 * ---------------------------------------------------------------------------
 * The checkout preview (hooks/useCart) and the amount actually recorded and
 * charged (lib/orderCapture) must never disagree by a single rupee, so both go
 * through the functions below. The site config supplies the percent; the server
 * reads it from the panel DB, the browser from the published snapshot.
 *
 * This file is imported by client components — keep it free of Node-only code.
 */

/** Payment methods that mean "the money is collected up front". */
export function isPrepaidMethod(method: string | undefined | null): boolean {
  const m = String(method ?? "").toLowerCase();
  return m === "razorpay" || m === "upi";
}

/* ------------------------- Coupon payment scoping ------------------------- */

export type CouponScope = "both" | "prepaid" | "cod";

/** Normalize a coupon's `appliesTo` — anything unknown/missing means "both". */
export function couponScope(coupon: { appliesTo?: string | null } | null | undefined): CouponScope {
  const s = String(coupon?.appliesTo ?? "").toLowerCase();
  return s === "prepaid" || s === "cod" ? s : "both";
}

/**
 * May this coupon discount an order paid with `paymentMethod`?
 * ONE rule for the checkout preview and the server capture — they must never
 * disagree. An undefined method (cart page, nothing chosen yet) allows the
 * coupon optimistically; the real gate is applied once a method is selected
 * and again on the server, which always knows the method.
 */
export function couponAllowedForMethod(
  coupon: { appliesTo?: string | null } | null | undefined,
  paymentMethod?: string | null
): boolean {
  const scope = couponScope(coupon);
  if (scope === "both") return true;
  if (paymentMethod === undefined || paymentMethod === null || paymentMethod === "") return true;
  return scope === "prepaid" ? isPrepaidMethod(paymentMethod) : !isPrepaidMethod(paymentMethod);
}

type PrepaidConfig = Pick<
  SiteConfig,
  "prepaidDiscountPercent" | "prepaidDiscountMax" | "onlinePaymentEnabled"
>;

/**
 * Is paying online offered at all? The owner's master switch (panel → Settings
 * → Payment options). Off means the "Pay Online" card is un-pickable and
 * /api/razorpay/order refuses — a COD-only shop.
 *
 * Absent means ON — an install that predates the switch (or a snapshot not yet
 * re-published) must not silently lose online payment.
 */
export function isOnlinePaymentEnabled(config: Partial<PrepaidConfig>): boolean {
  return config.onlinePaymentEnabled !== false;
}

/** Why online payment is unavailable when the owner has switched it off. */
export function onlinePaymentDisabledMessage(): string {
  return "Online payment is temporarily unavailable. Please choose Cash on Delivery.";
}

/**
 * The configured percent, clamped to something sane (0 = offer switched off).
 * Switching online payment off zeroes it too — a discount for a method nobody
 * can pick is a lie, and this one function is what every badge, savings line
 * and total on the site reads.
 */
export function prepaidPercent(config: Partial<PrepaidConfig>): number {
  if (!isOnlinePaymentEnabled(config)) return 0;
  const pct = Number(config.prepaidDiscountPercent ?? 0);
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  return Math.min(90, pct);
}

/**
 * Rupees off for paying online, computed on the POST-coupon subtotal so a
 * coupon and this offer can't stack into a negative total. Returns 0 when the
 * offer is off or the payment method is COD.
 */
export function prepaidDiscountFor(
  netSubtotal: number,
  config: Partial<PrepaidConfig>,
  paymentMethod?: string | null
): number {
  if (!isPrepaidMethod(paymentMethod)) return 0;
  const pct = prepaidPercent(config);
  const base = Math.max(0, Math.floor(Number(netSubtotal) || 0));
  if (pct === 0 || base === 0) return 0;

  let value = Math.round((base * pct) / 100);
  const cap = Number(config.prepaidDiscountMax ?? 0);
  if (Number.isFinite(cap) && cap > 0) value = Math.min(value, Math.round(cap));
  return Math.min(value, base);
}
