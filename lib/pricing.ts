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

type PrepaidConfig = Pick<SiteConfig, "prepaidDiscountPercent" | "prepaidDiscountMax">;

/** The configured percent, clamped to something sane (0 = offer switched off). */
export function prepaidPercent(config: Partial<PrepaidConfig>): number {
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
