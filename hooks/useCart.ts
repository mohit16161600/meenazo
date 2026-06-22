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
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else {
      discount = coupon.value;
    }
  }
  discount = Math.min(discount, subtotal);

  const freeShippingEligible = subtotal >= siteConfig.freeShippingThreshold || subtotal === 0;
  const shipping =
    subtotal === 0 || freeShippingEligible || coupon?.code === "FREESHIP" ? 0 : siteConfig.shippingCharge;
  const total = Math.max(0, subtotal - discount) + shipping;

  return {
    count,
    subtotal,
    discount,
    shipping,
    total,
    freeShippingEligible,
    amountToFreeShipping: Math.max(0, siteConfig.freeShippingThreshold - subtotal),
  };
}
