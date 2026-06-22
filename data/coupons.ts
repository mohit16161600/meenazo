import type { Coupon } from "@/types";

/** Demo coupons. A future API would validate these server-side. */
export const coupons: Coupon[] = [
  { code: "MEENA15", type: "percent", value: 15, minOrder: 0, maxDiscount: 500, description: "15% off your first order (max ₹500)", active: true },
  { code: "FLAT100", type: "flat", value: 100, minOrder: 599, description: "₹100 off on orders over ₹599", active: true },
  { code: "AYUR25", type: "percent", value: 25, minOrder: 1499, maxDiscount: 600, description: "25% off on orders over ₹1499 (max ₹600)", active: true },
  { code: "FREESHIP", type: "flat", value: 49, minOrder: 0, description: "Free shipping on any order", active: true },
];

export function findCoupon(code: string): Coupon | undefined {
  return coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.active);
}
