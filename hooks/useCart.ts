"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { siteConfig } from "@/data/site";
import { prepaidDiscountFor, prepaidPercent } from "@/lib/pricing";

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

  let discount = 0;
  if (coupon && subtotal >= (coupon.minOrder ?? 0)) {
    if (coupon.type === "percent") {
      // Math.round here mirrors the server (lib/orderCapture.applyCoupon) so the
      // total the customer sees equals the total actually recorded and charged.
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
  }
  discount = Math.min(discount, subtotal);

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
    subtotal === 0 || freeShippingEligible || coupon?.code === "FREESHIP" ? 0 : siteConfig.shippingCharge;
  const total = payable + shipping;

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
  };
}
