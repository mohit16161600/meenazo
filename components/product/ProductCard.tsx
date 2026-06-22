"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Badge, toneForBadge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Price } from "@/components/ui/Price";
import { WishlistButton } from "./WishlistButton";
import { AddPill } from "./AddToCartButton";
import { QuickViewModal } from "./QuickViewModal";

/**
 * Master product card — used on home sections, shop grid, related & wishlist.
 * Supports grid (default) and list view.
 */
export function ProductCard({ product, view = "grid" }: { product: Product; view?: "grid" | "list" }) {
  const [quickView, setQuickView] = useState(false);
  const href = `/product/${product.slug}`;

  if (view === "list") {
    return (
      <div className="card-surface card-hover flex flex-col sm:flex-row group">
        <Link href={href} className="relative sm:w-56 shrink-0">
          {product.badges?.[0] && (
            <span className="absolute top-3 left-3 z-10">
              <Badge variant={toneForBadge(product.badges[0])}>{product.badges[0]}</Badge>
            </span>
          )}
          <ArtPlaceholder
            emoji={product.emoji}
            gradient={product.gradient}
            src={product.images?.[0]}
            alt={product.name}
            className="h-48 sm:h-full"
            fontSize={72}
          />
        </Link>
        <div className="p-5 flex-1 flex flex-col">
          <StarRating rating={product.rating} count={product.reviewCount} />
          <Link href={href}>
            <h3 className="text-lg font-bold mt-1.5 hover:text-brand transition-colors">{product.name}</h3>
          </Link>
          <p className="text-sm text-muted mt-1 line-clamp-2">{product.shortDescription}</p>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <Price price={product.price} salePrice={product.salePrice} />
            <div className="flex items-center gap-2">
              <WishlistButton productId={product.id} productName={product.name} />
              <AddPill product={product} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card-surface card-hover group relative">
        {product.badges?.[0] && (
          <span className="absolute top-3.5 left-3.5 z-10">
            <Badge variant={toneForBadge(product.badges[0])}>{product.badges[0]}</Badge>
          </span>
        )}
        <span className="absolute top-3.5 right-3.5 z-10">
          <WishlistButton productId={product.id} productName={product.name} />
        </span>

        <Link href={href} className="block relative overflow-hidden">
          <ArtPlaceholder
            emoji={product.emoji}
            gradient={product.gradient}
            src={product.images?.[0]}
            alt={product.name}
            className="h-60"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setQuickView(true);
            }}
            className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all bg-white/95 backdrop-blur text-ink text-sm font-semibold py-2.5 rounded-full shadow-brand hover:bg-brand hover:text-white"
          >
            Quick view
          </button>
        </Link>

        <div className="p-5">
          <StarRating rating={product.rating} count={product.reviewCount} />
          <Link href={href}>
            <h3 className="text-[17px] font-bold mt-2 mb-1 hover:text-brand transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-[13px] text-muted mb-3.5 line-clamp-1">{product.shortDescription}</p>
          <div className="flex items-center justify-between gap-2">
            <Price price={product.price} salePrice={product.salePrice} />
            <AddPill product={product} />
          </div>
        </div>
      </div>

      <QuickViewModal product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}

/** Convenience grid wrapper. */
export function ProductGrid({ products, className }: { products: Product[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
