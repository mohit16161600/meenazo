"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { Button } from "@/components/ui/Button";
import { Price } from "@/components/ui/Price";
import { StarRating } from "@/components/ui/StarRating";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { PincodeChecker } from "@/components/ui/PincodeChecker";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { ShareButtons } from "./ShareButtons";
import { Icon } from "@/components/ui/Icon";
import { useCartStore } from "@/lib/store/cartStore";
import { useSelectedVariantIndex, useSelectedVariantStore } from "@/lib/store/selectedVariantStore";
import { getCategoryBySlug } from "@/data/categories";
import { cn } from "@/utils/cn";
import { formatPrice, discountPercent } from "@/utils/format";

const TRUST = [
  { icon: "truck", label: "Free shipping", sub: "Over ₹499" },
  { icon: "flask", label: "Lab tested", sub: "100% pure" },
  { icon: "return", label: "Easy returns", sub: "7-day policy" },
];

/** Right-hand purchase panel: pricing, stock, quantity and primary actions. */
export function BuyBox({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  const variants = product.variants ?? [];
  // Selection is shared (via store) so the mobile sticky bar honors the same pick.
  const variantIdx = useSelectedVariantIndex(product.id);
  const setVariantIndex = useSelectedVariantStore((s) => s.setIndex);
  const setVariantIdx = (idx: number) => setVariantIndex(product.id, idx);
  const selected = variants[variantIdx];

  // Selected pack drives the displayed price + unit; falls back to the base
  // product when it has no varieties.
  const displayPrice = selected?.price ?? product.price;
  const displaySalePrice = selected ? selected.salePrice : product.salePrice;
  const displayUnit = selected?.unit ?? product.unit;

  const category = getCategoryBySlug(product.category);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;

  const buyNow = () => {
    if (outOfStock) return;
    addItem(product, qty, selected);
    router.push("/checkout");
  };

  return (
    <div className="lg:pt-2">
      {/* Category */}
      {category && (
        <Link
          href={`/category/${category.slug}`}
          className="eyebrow hover:text-brand-dark transition-colors"
        >
          {category.emoji} {category.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-ink mt-2 leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      <a href="#reviews" className="inline-flex items-center gap-1.5 mt-3 group">
        <StarRating rating={product.rating} size="md" />
        <span className="text-sm text-muted group-hover:text-brand transition-colors">
          {product.rating.toFixed(1)} · {product.reviewCount.toLocaleString("en-IN")} reviews
        </span>
      </a>

      {/* Price */}
      <div className="mt-4">
        <Price price={displayPrice} salePrice={displaySalePrice} showDiscount className="!text-3xl" />
        {displayUnit && <p className="text-sm text-muted mt-1">{displayUnit} · Inclusive of all taxes</p>}
      </div>

      {/* Short description */}
      <p className="text-muted leading-relaxed mt-4">{product.shortDescription}</p>

      {/* Pack / variety picker */}
      {variants.length > 0 && (
        <div className="mt-5">
          <span className="text-sm font-semibold text-ink">Choose your pack</span>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {variants.map((v, idx) => {
              const active = idx === variantIdx;
              const eff = v.salePrice != null && v.salePrice < v.price ? v.salePrice : v.price;
              const off = discountPercent(v.price, v.salePrice);
              return (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setVariantIdx(idx)}
                  aria-pressed={active}
                  className={cn(
                    "text-left rounded-brand border p-3 transition-colors",
                    active
                      ? "border-brand bg-brand/5 ring-1 ring-brand"
                      : "border-line hover:border-brand/50"
                  )}
                >
                  <span className="block text-sm font-semibold text-ink">{v.label}</span>
                  <span className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-bold tabular-nums">{formatPrice(eff)}</span>
                    {off > 0 && (
                      <s className="text-xs text-muted tabular-nums">{formatPrice(v.price)}</s>
                    )}
                  </span>
                  {off > 0 && (
                    <span className="mt-0.5 block text-[11px] font-semibold text-brand">
                      {off}% OFF
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock status */}
      <div className="mt-4">
        {outOfStock ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Out of stock
          </span>
        ) : lowStock ? (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-gold">
            <span className="w-2 h-2 rounded-full bg-gold" /> Only {product.stock} left — order soon
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand">
            <span className="w-2 h-2 rounded-full bg-brand" /> In stock — ships in 24 hours
          </span>
        )}
      </div>

      {/* Highlights */}
      {product.highlights && product.highlights.length > 0 && (
        <ul className="mt-5 grid sm:grid-cols-2 gap-x-4 gap-y-2">
          {product.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 text-sm text-ink">
              <Icon name="check" size={16} className="text-brand mt-0.5 shrink-0" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Quantity + actions */}
      <div className="mt-6 border-t border-line pt-6">
        {!outOfStock && (
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-semibold text-ink">Quantity</span>
            <QuantitySelector value={qty} onChange={setQty} min={1} max={Math.max(1, product.stock)} />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <AddToCartButton product={product} quantity={qty} variety={selected} block />
          <Button variant="dark" block onClick={buyNow} disabled={outOfStock}>
            Buy Now
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="flex items-center gap-2">
            <WishlistButton productId={product.id} productName={product.name} />
            <span className="text-sm text-muted">Save for later</span>
          </div>
          <ShareButtons product={product} />
        </div>
      </div>

      {/* Pincode checker */}
      <PincodeChecker className="mt-6" />

      {/* Trust strip */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {TRUST.map((t) => (
          <div
            key={t.label}
            className="rounded-brand border border-line bg-white p-3 text-center"
          >
            <Icon name={t.icon} size={22} className="text-brand mx-auto" />
            <div className="text-xs font-semibold text-ink mt-1">{t.label}</div>
            <div className="text-[11px] text-muted">{t.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
