"use client";

import { useCartSummary } from "@/hooks/useCart";
import { useCartStore } from "@/lib/store/cartStore";
import { formatPrice } from "@/utils/format";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CouponBox } from "./CouponBox";

/**
 * Reusable order summary card — drives the cart & checkout sidebars.
 * Reads live totals from useCartSummary() (cart store + applied coupon).
 */
export function OrderSummary({
  showCheckoutButton = false,
  showCoupon = false,
}: {
  showCheckoutButton?: boolean;
  showCoupon?: boolean;
}) {
  const { count, subtotal, discount, shipping, total, freeShippingEligible, amountToFreeShipping } =
    useCartSummary();
  const coupon = useCartStore((s) => s.coupon);

  // Progress towards the free-shipping threshold.
  const threshold = siteConfig.freeShippingThreshold;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="card-surface p-6">
      <h3 className="text-lg font-bold">Order summary</h3>
      <p className="text-sm text-muted mt-0.5">
        {count} {count === 1 ? "item" : "items"} in your cart
      </p>

      {/* Free-shipping progress hint */}
      {!freeShippingEligible && subtotal > 0 && (
        <div className="mt-5 rounded-brand bg-mint/70 p-4">
          <p className="text-sm text-brand-dark font-medium inline-flex flex-wrap items-center gap-1.5">
            <Icon name="truck" size={16} className="text-brand" />
            <span>
              Add <strong>{formatPrice(amountToFreeShipping)}</strong> more for{" "}
              <span className="font-bold">FREE shipping</span>
            </span>
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-white/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progress to free shipping"
            />
          </div>
        </div>
      )}

      {freeShippingEligible && subtotal > 0 && (
        <div className="mt-5 rounded-brand bg-mint/70 p-4">
          <p className="text-sm text-brand-dark font-medium">
            🎉 You&apos;ve unlocked <span className="font-bold">FREE shipping</span>!
          </p>
        </div>
      )}

      {/* Coupon */}
      {showCoupon && (
        <div className="mt-5">
          <CouponBox />
        </div>
      )}

      {/* Totals */}
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between text-brand">
            <dt className="flex items-center gap-1.5">
              Discount
              {coupon && <span className="chip chip-soft">{coupon.code}</span>}
            </dt>
            <dd className="font-semibold tabular-nums">−{formatPrice(discount)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between">
          <dt className="text-muted">Shipping</dt>
          <dd className="font-semibold tabular-nums">
            {shipping === 0 ? <span className="text-brand">FREE</span> : formatPrice(shipping)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
        <span className="text-base font-bold">Total</span>
        <span className="text-xl font-extrabold tabular-nums">{formatPrice(total)}</span>
      </div>
      <p className="text-xs text-muted mt-1">Inclusive of all taxes</p>

      {showCheckoutButton && (
        <div className="mt-5">
          <Button href="/checkout" size="lg" block>
            Proceed to checkout
          </Button>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
            <Icon name="lock" size={14} />
            <span>Secure, encrypted checkout</span>
          </div>
        </div>
      )}
    </div>
  );
}
