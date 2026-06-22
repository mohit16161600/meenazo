"use client";

import type { Product } from "@/types";
import { Price } from "@/components/ui/Price";
import { AddToCartButton } from "@/components/product/AddToCartButton";

/**
 * Fixed bottom purchase bar shown only on mobile (lg:hidden).
 * Sits above content via fixed positioning; the page reserves bottom padding
 * so nothing is hidden behind it.
 */
export function StickyMobileBuy({ product }: { product: Product }) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-line shadow-brand-lg pb-[env(safe-area-inset-bottom)]">
      <div className="wrap flex items-center gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{product.name}</p>
          <Price price={product.price} salePrice={product.salePrice} className="!text-base" />
        </div>
        <AddToCartButton
          product={product}
          label={product.stock <= 0 ? "Sold out" : "Add to Cart"}
          className="shrink-0"
        />
      </div>
    </div>
  );
}
