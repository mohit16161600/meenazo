"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { StarRating } from "@/components/ui/StarRating";
import { Price } from "@/components/ui/Price";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { AddToCartButton } from "./AddToCartButton";
import { WishlistButton } from "./WishlistButton";

/** Lightweight quick-view dialog launched from product cards. */
export function QuickViewModal({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="grid md:grid-cols-2">
        <ArtPlaceholder
          emoji={product.emoji}
          gradient={product.gradient}
          src={product.images?.[0]}
          alt={product.name}
          className="h-64 md:h-full min-h-[280px]"
          fontSize={120}
        />
        <div className="p-7">
          <StarRating rating={product.rating} count={product.reviewCount} />
          <h3 className="text-2xl font-bold mt-2">{product.name}</h3>
          <p className="text-sm text-muted mt-2 mb-4">{product.shortDescription}</p>
          <Price price={product.price} salePrice={product.salePrice} showDiscount className="text-2xl" />

          <ul className="mt-4 space-y-1.5">
            {product.benefits.slice(0, 3).map((b) => (
              <li key={b} className="text-sm text-muted flex gap-2">
                <span className="text-brand">✓</span> {b}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <QuantitySelector value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <WishlistButton productId={product.id} productName={product.name} size={44} />
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            <AddToCartButton product={product} quantity={qty} block />
            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="btn btn-ghost btn-block"
            >
              View full details
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
