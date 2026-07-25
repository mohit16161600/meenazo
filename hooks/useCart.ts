"use client";

import { useCartStore } from "@/lib/store/cartStore";
import { siteConfig } from "@/data/site";

export interface CartSummary {
  count: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  freeShippingEligible: boolean;
  amountToFreeShipping: number;
}

/** Reactive cart totals derived from the cart store + applied coupon. */
export function useCartSummary(): CartSummary {
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

  // Free-shipping is judged on the POST-discount subtotal to match the server
  // (lib/orderCapture.applyCoupon), so the total shown never undershoots what's
  // actually charged when a large coupon drops the order below the threshold.
  const netSubtotal = Math.max(0, subtotal - discount);
  const freeShippingEligible = netSubtotal >= siteConfig.freeShippingThreshold || subtotal === 0;
  const shipping =
    subtotal === 0 || freeShippingEligible || coupon?.code === "FREESHIP" ? 0 : siteConfig.shippingCharge;
  const total = netSubtotal + shipping;

  return {
    count,
    subtotal,
    discount,
    shipping,
    total,
    freeShippingEligible,
    amountToFreeShipping: Math.max(0, siteConfig.freeShippingThreshold - netSubtotal),
  };
}
