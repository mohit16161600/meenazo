"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Coupon, Product, ProductVariant } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";
import { effectivePrice } from "@/utils/format";

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  /** Add a product to the cart. Pass `variant` to add a specific pack option;
   *  when omitted, a product that has variants defaults to its first one so the
   *  line always matches a real, server-priceable variety. */
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  setCoupon: (coupon: Coupon | null) => void;
  clear: () => void;
}

/** Two cart lines are the same line only when product AND chosen variety match. */
const sameLine = (i: CartItem, productId: string, variant?: string) =>
  i.productId === productId && (i.variant ?? "") === (variant ?? "");

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1, variant) =>
        set((state) => {
          // A product with variants always resolves to one (the picked one, or
          // the first) so pricing and the recorded order stay consistent.
          const chosen = variant ?? product.variants?.[0];
          const label = chosen?.label;
          const unitPrice = chosen
            ? effectivePrice(chosen.price, chosen.salePrice)
            : effectivePrice(product.price, product.salePrice);

          const existing = state.items.find((i) => sameLine(i, product.id, label));
          if (existing) {
            return {
              items: state.items.map((i) =>
                i === existing
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            };
          }
          const item: CartItem = {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: unitPrice,
            image: product.images?.[0],
            emoji: product.emoji,
            gradient: product.gradient,
            quantity: Math.min(quantity, product.stock),
            unit: chosen?.unit ?? product.unit,
            variant: label,
            stock: product.stock,
          };
          return { items: [...state.items, item] };
        }),
      removeItem: (productId, variant) =>
        set((state) => ({
          items: state.items.filter((i) => !sameLine(i, productId, variant)),
        })),
      updateQuantity: (productId, quantity, variant) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              sameLine(i, productId, variant)
                ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) }
                : i
            )
            .filter((i) => i.quantity > 0),
        })),
      setCoupon: (coupon) => set({ coupon }),
      clear: () => set({ items: [], coupon: null }),
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // v1 introduced per-variant cart lines (CartItem.variant). Bumping the
      // version discards any pre-variant persisted cart so a legacy line (no
      // variant) can't sit un-mergeable beside a new default-variant line.
      version: 1,
    }
  )
);
