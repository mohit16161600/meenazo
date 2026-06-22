"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, Coupon, Product } from "@/types";
import { STORAGE_KEYS } from "@/utils/constants";
import { effectivePrice } from "@/utils/format";

interface CartState {
  items: CartItem[];
  coupon: Coupon | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCoupon: (coupon: Coupon | null) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      coupon: null,
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            };
          }
          const item: CartItem = {
            productId: product.id,
            name: product.name,
            slug: product.slug,
            price: effectivePrice(product.price, product.salePrice),
            image: product.images?.[0],
            emoji: product.emoji,
            gradient: product.gradient,
            quantity: Math.min(quantity, product.stock),
            unit: product.unit,
            stock: product.stock,
          };
          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.productId === productId
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
    }
  )
);
