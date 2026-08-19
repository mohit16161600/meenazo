"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { siteConfig } from "@/data/site";
import {
  prepaidDiscountFor,
  prepaidPercent,
  couponAllowedForMethod,
  couponScope,
  isOnlinePaymentEnabled,
} from "@/lib/pricing";
import { codMaxOrderValue, isCodAmountAllowed, isCodEnabled } from "@/lib/codRules";

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
   * The owner's master switches for the two payment methods. Read here from the
   * PUBLISHED snapshot, so it's only the placeholder — checkout replaces both
   * with the server's live answer (hooks/useServerQuote).
   */
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
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

  // Does the coupon clear its own minimum? Everything it grants — the rupees
  // AND free shipping — is gated on this, exactly as applyCoupon does server
  // side. Free shipping used to skip this check here, so a FREESHIP with a
  // minimum showed ₹49 less than the server charged.
  const couponQualifies = Boolean(coupon) && subtotal >= (coupon?.minOrder ?? 0);

  // A coupon worth 0 IS the free-shipping coupon — that is the server's rule
  // (lib/orderCapture.applyCoupon). Matching on the literal code "FREESHIP"
  // meant a renamed coupon waived nothing here and ₹49 there, and a FREESHIP
  // given a rupee value waived shipping here and not there.
  const couponIsFreeShipping = couponQualifies && coupon?.value === 0;

  // The coupon's rupee value, before method scoping.
  let rawDiscount = 0;
  if (coupon && couponQualifies && coupon.value !== 0) {
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

  // Prepaid offer: applied only when an online method is selected.
  const prepaidDiscount = prepaidDiscountFor(netSubtotal, siteConfig, paymentMethod);

  // Free shipping is judged on the amount after BOTH discounts, matching the
  // server, so the shown total never undershoots what is actually charged.
  const payable = Math.max(0, netSubtotal - prepaidDiscount);
  const freeShippingEligible = payable >= siteConfig.freeShippingThreshold || subtotal === 0;
  const shipping =
    subtotal === 0 || freeShippingEligible || (couponAllowed && couponIsFreeShipping)
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
    (codCouponOk && couponIsFreeShipping)
      ? 0
      : siteConfig.shippingCharge;
  const codTotal = codNetSubtotal + codShipping;

  // What paying online ACTUALLY saves: the difference between the two full
  // totals, not the prepaid discount on its own. Those are different numbers
  // whenever a coupon is scoped to one method — with a COD-only coupon, paying
  // online can even cost MORE, and the old figure cheerfully advertised a
  // saving for it. Clamped at 0 so the nudge simply disappears in that case.
  const prepaidCouponOk = couponAllowedForMethod(coupon, "razorpay");
  const prepaidNetSubtotal = Math.max(0, subtotal - (prepaidCouponOk ? rawDiscount : 0));
  const prepaidOffer = prepaidDiscountFor(prepaidNetSubtotal, siteConfig, "razorpay");
  const prepaidPayable = Math.max(0, prepaidNetSubtotal - prepaidOffer);
  const prepaidShipping =
    subtotal === 0 ||
    prepaidPayable >= siteConfig.freeShippingThreshold ||
    (prepaidCouponOk && couponIsFreeShipping)
      ? 0
      : siteConfig.shippingCharge;
  // ...and no saving at all when online payment is switched off: a prepaid-only
  // coupon would otherwise still advertise "pay online and save" for a method
  // nobody can pick.
  const prepaidSaving = isOnlinePaymentEnabled(siteConfig)
    ? Math.max(0, codTotal - (prepaidPayable + prepaidShipping))
    : 0;

  // How much MORE cart is needed to reach free shipping.
  //
  // The threshold is judged on the payable amount, and the prepaid discount
  // takes a percentage of it — so adding ₹100 of product only moves `payable`
  // by ₹80 at a 20% offer. Quoting the raw gap therefore always fell short and
  // the customer was still charged shipping. This scales the gap back up.
  const pctOff = subtotal > 0 ? prepaidDiscount / Math.max(1, netSubtotal) : 0;
  const gap = Math.max(0, siteConfig.freeShippingThreshold - payable);
  const amountToFreeShipping = gap > 0 ? Math.ceil(gap / Math.max(0.05, 1 - pctOff)) : 0;

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
    amountToFreeShipping,
    codTotal,
    codAmountAllowed: isCodAmountAllowed(codTotal, siteConfig),
    codMaxOrderValue: codMaxOrderValue(siteConfig),
    codEnabled: isCodEnabled(siteConfig),
    onlinePaymentEnabled: isOnlinePaymentEnabled(siteConfig),
    couponBlocked,
  };
}
