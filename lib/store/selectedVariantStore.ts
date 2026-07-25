"use client";

import { create } from "zustand";

/**
 * The pack/variety the customer is currently viewing on a product detail page,
 * keyed by productId. Lives here (not in BuyBox's local state) so BOTH the
 * BuyBox picker and the mobile sticky buy bar — separate, far-apart components
 * on the same page — agree on the selected pack. Not persisted: it is transient
 * UI state, meaningful only while a product page is open.
 */
interface SelectedVariantState {
  byProduct: Record<string, number>;
  setIndex: (productId: string, index: number) => void;
}

export const useSelectedVariantStore = create<SelectedVariantState>((set) => ({
  byProduct: {},
  setIndex: (productId, index) =>
    set((state) => ({ byProduct: { ...state.byProduct, [productId]: index } })),
}));

/** Reactive selected variant index for one product (defaults to 0). */
export function useSelectedVariantIndex(productId: string): number {
  return useSelectedVariantStore((s) => s.byProduct[productId] ?? 0);
}
