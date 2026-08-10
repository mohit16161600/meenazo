"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { siteConfig } from "@/data/site";
import { prepaidDiscountFor, prepaidPercent, couponAllowedForMethod, couponScope } from "@/lib/pricing";
import { codMaxOrderValue, isCodAmountAllowed } from "@/lib/codRules";

export interface CartSummary {
  count: number;
  subtotal: number;
  /** Coupon discount. */
  discount: number;
  /** Prepaid discount actually applied to `total` (0 unless paying online). */
  prepaidDiscount: number;
  /** What paying online WOULD save — drives the "save ₹X" nudge on COD. */
  prepaidSaving: number;
  /** Configured offer percent (0 = offer switched off in the panel). */
  prepaidPercent: number;
  shipping: number;
  total: number;
  freeShippingEligible: boolean;
  amountToFreeShipping: number;
  /** What this order would cost as COD (no prepaid discount) — the amount the cap is judged on. */
  codTotal: number;
  /** False when `codTotal` is over the configured COD cap — prepaid only. */
  codAmountAllowed: boolean;
  /** The configured cap in ₹ (0 = no cap). */
  codMaxOrderValue: number;
  /**
   * Set when an applied coupon is scoped to the OTHER payment method — e.g. a
   * prepaid-only coupon while COD is selected. The discount is 0 (matching the
   * server) and checkout can tell the customer why.
   */
  couponBlocked: "prepaid" | "cod" | null;
}

/**
 * Reactive cart totals derived from the cart store + applied coupon.
 *
 * Pass the chosen payment method on checkout so the preview includes the
 * prepaid discount. Every number here mirrors lib/orderCapture.captureOrder
 * (via the shared lib/pricing helpers) — what the customer sees is exactly what
 * the server records and charges.
 */
export function useCartSummary(paymentMethod?: string): CartSummary {
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Payment-method scoping (prepaid-only / COD-only coupons) — same rule as
  // the server (lib/pricing.ts). On the cart page (no method chosen yet) the
  // coupon shows optimistically; checkout passes the selected method and the
  // preview then matches the server to the rupee.
  const couponAllowed = couponAllowedForMethod(coupon, paymentMethod);
  const couponBlocked: "prepaid" | "cod" | null =
    coupon && !couponAllowed ? (couponScope(coupon) as "prepaid" | "cod") : null;

  // The coupon's rupee value, before method scoping.
  let rawDiscount = 0;
  if (coupon && subtotal >= (coupon.minOrder ?? 0)) {
    if (coupon.type === "percent") {
      // Math.round here mirrors the server (lib/orderCapture.applyCoupon) so the
      // total the customer sees equals the total actually recorded and charged.
      rawDiscount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) rawDiscount = Math.min(rawDiscount, coupon.maxDiscount);
    } else {
      rawDiscount = coupon.value;
    }
  }
  rawDiscount = Math.min(rawDiscount, subtotal);

  const discount = couponAllowed ? rawDiscount : 0;
  const netSubtotal = Math.max(0, subtotal - discount);

  // Prepaid offer: applied only when an online method is selected, but always
  // computed so COD can advertise what the customer is leaving on the table.
  const prepaidDiscount = prepaidDiscountFor(netSubtotal, siteConfig, paymentMethod);
  const prepaidSaving = prepaidDiscountFor(netSubtotal, siteConfig, "razorpay");

  // Free shipping is judged on the amount after BOTH discounts, matching the
  // server, so the shown total never undershoots what is actually charged.
  const payable = Math.max(0, netSubtotal - prepaidDiscount);
  const freeShippingEligible = payable >= siteConfig.freeShippingThreshold || subtotal === 0;
  const shipping =
    subtotal === 0 || freeShippingEligible || (couponAllowed && coupon?.code === "FREESHIP")
      ? 0
      : siteConfig.shippingCharge;
  const total = payable + shipping;

  // What the courier would collect if this order went COD — no prepaid discount,
  // so shipping is judged on the post-coupon subtotal alone. This (not `total`)
  // is the number the COD cap is applied to, on both sides: it stays the same
  // whichever payment method is currently selected, matching the server, which
  // prices a COD order exactly this way.
  // A prepaid-only coupon contributes nothing to a COD order, so the COD
  // preview is priced with its own coupon allowance — matching the server.
  const codCouponOk = couponAllowedForMethod(coupon, "cod");
  const codNetSubtotal = Math.max(0, subtotal - (codCouponOk ? rawDiscount : 0));
  const codShipping =
    subtotal === 0 ||
    codNetSubtotal >= siteConfig.freeShippingThreshold ||
    (codCouponOk && coupon?.code === "FREESHIP")
      ? 0
      : siteConfig.shippingCharge;
  const codTotal = codNetSubtotal + codShipping;

  return {
    count,
    subtotal,
    discount,
    prepaidDiscount,
    prepaidSaving,
    prepaidPercent: prepaidPercent(siteConfig),
    shipping,
    total,
    freeShippingEligible,
    amountToFreeShipping: Math.max(0, siteConfig.freeShippingThreshold - payable),
    codTotal,
    codAmountAllowed: isCodAmountAllowed(codTotal, siteConfig),
    codMaxOrderValue: codMaxOrderValue(siteConfig),
    couponBlocked,
  };
}
