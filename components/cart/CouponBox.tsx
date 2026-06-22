"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cartStore";
import { useToast } from "@/context/ToastContext";
import { findCoupon } from "@/data/coupons";
import { formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/ui/Icon";

/**
 * Coupon code entry. Validates against findCoupon(), applies via
 * useCartStore.setCoupon, and shows the applied coupon with a remove control.
 */
export function CouponBox() {
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const subtotal = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  const toast = useToast();

  const [code, setCode] = useState("");

  const apply = () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Enter a code", "Please type a coupon code to apply.");
      return;
    }
    const found = findCoupon(trimmed);
    if (!found) {
      toast.error("Invalid coupon", `"${trimmed.toUpperCase()}" is not a valid code.`);
      return;
    }
    if (found.minOrder && subtotal < found.minOrder) {
      toast.error(
        "Minimum order not met",
        `Add items worth ${formatPrice(found.minOrder)} to use ${found.code}.`
      );
      return;
    }
    setCoupon(found);
    setCode("");
    toast.success("Coupon applied", found.description);
  };

  const remove = () => {
    setCoupon(null);
    toast.info("Coupon removed", "The discount has been removed from your order.");
  };

  if (coupon) {
    return (
      <div className="rounded-brand border border-brand/30 bg-mint/60 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Icon name="check-circle" size={18} className="text-brand" />
              <span className="font-bold text-brand-dark">{coupon.code}</span>
              <span className="chip chip-soft">Applied</span>
            </div>
            <p className="text-xs text-muted mt-1">{coupon.description}</p>
          </div>
          <button
            type="button"
            onClick={remove}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink transition-colors"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="coupon-code" className="label">
        Have a coupon?
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply();
            }
          }}
          placeholder="e.g. MEENA15"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className={cn("field uppercase placeholder:normal-case placeholder:lowercase tracking-wide")}
        />
        <button
          type="button"
          onClick={apply}
          className="btn btn-dark shrink-0"
          disabled={!code.trim()}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
