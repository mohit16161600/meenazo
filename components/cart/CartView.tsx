"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/store/cartStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useToast } from "@/context/ToastContext";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { trustBadges } from "@/data/trust";
import { CartItemRow } from "./CartItemRow";
import { OrderSummary } from "./OrderSummary";

/** The full cart page body: item list + sticky order summary, with loading & empty states. */
export function CartView() {
  const hydrated = useHydrated();
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const toast = useToast();

  // Until the persisted store is rehydrated, show a skeleton (avoids flashes/mismatch).
  if (!hydrated) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="Your cart is empty"
        message="Looks like you haven't added anything yet. Explore our authentic Ayurvedic formulations and start your wellness journey."
        actionLabel="Start shopping"
        actionHref="/shop"
      />
    );
  }

  const handleClear = () => {
    clear();
    toast.info("Cart cleared", "All items were removed from your cart.");
  };

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 items-start">
      {/* Left: items */}
      <div>
        <div className="card-surface p-6">
          <div className="flex items-center justify-between gap-4 pb-2">
            <h3 className="text-lg font-bold">
              Cart{" "}
              <span className="text-muted font-medium text-base">
                ({items.length} {items.length === 1 ? "item" : "items"})
              </span>
            </h3>
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-semibold text-muted hover:text-red-600 transition-colors"
            >
              Clear cart
            </button>
          </div>

          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.productId}>
                <CartItemRow item={item} />
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 mt-5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          <span aria-hidden>←</span> Continue shopping
        </Link>

        {/* Trust badges */}
        <ul className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {trustBadges.slice(0, 3).map((b) => (
            <li key={b.label} className="flex items-center gap-3 rounded-brand bg-soft p-3.5">
              <span className="text-xl" aria-hidden>
                {b.icon}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight">{b.label}</p>
                {b.sublabel && <p className="text-xs text-muted leading-tight">{b.sublabel}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: summary (sticky) */}
      <div className="lg:sticky lg:top-24">
        <OrderSummary showCoupon showCheckoutButton />
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-10 items-start">
      <div className="card-surface p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="divide-y divide-line">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 py-5">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-brand shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-10 w-28 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="card-surface p-6 space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-12 w-full rounded-brand" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}
