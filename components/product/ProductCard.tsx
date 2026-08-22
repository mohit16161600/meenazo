"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/data/site";
import { prepaidDiscountFor } from "@/lib/pricing";
import { formatPrice, discountPercent, effectivePrice } from "@/utils/format";
import { WishlistButton } from "./WishlistButton";
import { AddPill, AddToCartButton } from "./AddToCartButton";
import { QuickViewModal } from "./QuickViewModal";

/**
 * Price block: what it costs, and what it costs if you pay online.
 * ---------------------------------------------------------------------------
 * The prepaid figure runs through the SAME `prepaidDiscountFor` the checkout
 * and the server use, so the number promised on a card can never drift from the
 * number actually charged. It hides itself when the panel switches the offer
 * off (percent 0), rather than needing every call site edited.
 */
function PriceBlock({ product, className }: { product: Product; className?: string }) {
  const sell = effectivePrice(product.price, product.salePrice);
  const onSale = product.salePrice != null && product.salePrice < product.price;
  const prepaidOff = prepaidDiscountFor(sell, siteConfig, "razorpay");

  return (
    <div className={cn("flex items-end justify-between gap-2", className)}>
      <div className="min-w-0">
        <div className="text-[17px] font-extrabold leading-none text-ink sm:text-[19px]">
          {formatPrice(sell)}
        </div>
        {onSale && (
          <s className="mt-1.5 block text-[12px] font-medium leading-none text-muted sm:text-[13px]">
            {formatPrice(product.price)}
          </s>
        )}
      </div>

      {prepaidOff > 0 && (
        /* shrink-0: on a 2-up phone grid the two columns are only just wide
           enough, and the prepaid figure must never be the one that squeezes. */
        <div className="shrink-0 text-right">
          <div className="text-[13px] font-extrabold leading-none text-brand sm:text-[17px]">
            {formatPrice(sell - prepaidOff)}
          </div>
          <div className="mt-1.5 text-[10px] font-bold uppercase leading-none tracking-wider text-brand">
            Prepaid
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Master product card — used on home sections, shop grid, related & wishlist.
 * Supports grid (default) and list view.
 */
export function ProductCard({
  product,
  view = "grid",
  footer,
}: {
  product: Product;
  view?: "grid" | "list";
  /**
   * Extra controls pinned under the card's own CTA — currently the wishlist's
   * "remove". A slot rather than a second card component: everything above it
   * (badges, rating, sale %, the prepaid figure) is pricing the whole shop
   * relies on, and a copy of this card would be one price rule behind the day
   * someone changed it here.
   */
  footer?: React.ReactNode;
}) {
  const [quickView, setQuickView] = useState(false);
  const href = `/product/${product.slug}`;
  /**
   * The per-product gradient is art direction for the emoji fallback ONLY. A
   * real photo goes on the shared tile instead, so a row of cards reads as one
   * shelf rather than three differently-tinted boxes.
   */
  const hasPhoto = Boolean(product.images?.length);

  /**
   * The saving is computed, never typed: a panel badge that says "50% OFF" goes
   * stale the moment a price changes. Any hand-written badge that just restates
   * the discount is dropped so the corner never shows two versions of it — what
   * survives is the editorial label ("Bestseller", "New") worth keeping.
   */
  const offPercent = discountPercent(product.price, product.salePrice);
  const marketingBadge = product.badges?.find((b) => !/%|off|sale/i.test(b));

  if (view === "list") {
    return (
      <div className="card-surface card-hover flex flex-col sm:flex-row group">
        <Link href={href} className="relative sm:w-56 shrink-0">
          <span className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {offPercent > 0 && <Badge variant="brand">{offPercent}% OFF</Badge>}
            {marketingBadge && <Badge variant="soft">{marketingBadge}</Badge>}
          </span>
          <ArtPlaceholder
            emoji={product.emoji}
            gradient={hasPhoto ? undefined : product.gradient}
            src={product.images?.[0]}
            alt={product.name}
            className={cn("h-48 sm:h-full", hasPhoto && "product-tile")}
            imgClassName="p-4"
            sizes="(max-width: 640px) 100vw, 224px"
            fontSize={72}
          />
        </Link>
        <div className="p-5 flex-1 flex flex-col">
          <StarRating rating={product.rating} count={product.reviewCount} />
          <Link href={href}>
            <h3 className="text-lg font-bold mt-1.5 hover:text-brand transition-colors">{product.name}</h3>
          </Link>
          <p className="text-sm text-muted mt-1 line-clamp-2">{product.shortDescription}</p>
          <div className="mt-auto flex items-end justify-between gap-4 pt-4">
            <PriceBlock product={product} className="max-w-[240px] flex-1" />
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
      {/* h-full + flex column: cards in a row end up the same height and their
          price/CTA rows line up even when the copy runs to different lengths. */}
      <article className="card-surface card-hover group relative flex h-full flex-col">
        <div className="relative">
          <Link href={href} className="block">
            <ArtPlaceholder
              emoji={product.emoji}
              gradient={hasPhoto ? undefined : product.gradient}
              src={product.images?.[0]}
              alt={product.name}
              /* Square, so a portrait pack shot and a square one occupy the same
                 slot; `contain` keeps every bottle whole — cropping a product
                 photo to fill the box is what made these look mismatched. */
              className={cn("aspect-square", hasPhoto && "product-tile")}
              /* Less inset on a 2-up phone grid, where the tile is small to
                 begin with and generous padding would shrink the bottle. */
              imgClassName="p-4 transition-transform duration-500 group-hover:scale-[1.06] sm:p-6 lg:p-7"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
            />
          </Link>

          <span className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-1.5">
            {offPercent > 0 && <Badge variant="brand">{offPercent}% OFF</Badge>}
            {marketingBadge && <Badge variant="soft">{marketingBadge}</Badge>}
          </span>

          {/* Actions stack in the corner rather than a bar across the artwork —
              the old hover pill sat right over the bottle. */}
          <div className="absolute right-3.5 top-3.5 z-10 flex flex-col gap-2">
            <WishlistButton productId={product.id} productName={product.name} />
            <button
              type="button"
              onClick={() => setQuickView(true)}
              aria-label={`Quick view — ${product.name}`}
              className="hidden h-[38px] w-[38px] items-center justify-center rounded-full border border-line bg-white/90 text-ink/60 opacity-0 shadow-sm transition-all hover:scale-110 hover:bg-brand hover:text-white focus-visible:opacity-100 group-hover:opacity-100 md:flex"
            >
              <Icon name="search" size={17} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {/* Name first: it is what someone scans for. The rating qualifies it,
              so it reads better underneath than above. */}
          <Link href={href}>
            <h3 className="line-clamp-2 text-[15px] font-bold leading-snug transition-colors hover:text-brand sm:text-[17px]">
              {product.name}
            </h3>
          </Link>
          <StarRating rating={product.rating} count={product.reviewCount} className="mt-2" />
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted">
            {product.shortDescription}
          </p>

          {/* mt-auto pins this block to the bottom of every card */}
          <div className="mt-auto pt-4">
            <PriceBlock product={product} className="border-t border-line pt-3.5" />
            {footer ? (
              <div className="mt-3.5 flex items-stretch gap-2">
                <AddToCartButton product={product} block label="Add to cart" className="flex-1" />
                {footer}
              </div>
            ) : (
              <AddToCartButton product={product} block label="Add to cart" className="mt-3.5" />
            )}
          </div>
        </div>
      </article>

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
