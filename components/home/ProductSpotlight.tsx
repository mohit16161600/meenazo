import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { StarRating } from "@/components/ui/StarRating";
import { Price } from "@/components/ui/Price";
import { Badge, toneForBadge } from "@/components/ui/Badge";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { products } from "@/data/products";
import { cn } from "@/utils/cn";

/**
 * Editorial product feature bands — one rich, alternating panel per product.
 * Designed to showcase a small catalogue beautifully (no repetitive grids).
 */
export function ProductSpotlight() {
  if (products.length === 0) return null;

  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          center
          eyebrow="Our formulas"
          title="Crafted for real results"
          subtitle="Every Meenazo formula is 100% herbal, made in India, and built around time-honoured Ayurvedic herbs."
        />

        <div className="mt-4 flex flex-col gap-6">
          {products.map((product, i) => {
            const reversed = i % 2 === 1;
            return (
              <div
                key={product.id}
                className="card-surface grid items-center overflow-hidden md:grid-cols-2"
              >
                {/* Art */}
                <div className={cn("relative", reversed && "md:order-2")}>
                  {product.badges?.[0] && (
                    <span className="absolute left-4 top-4 z-10">
                      <Badge variant={toneForBadge(product.badges[0])}>{product.badges[0]}</Badge>
                    </span>
                  )}
                  <ArtPlaceholder
                    emoji={product.emoji}
                    gradient={product.gradient}
                    src={product.images?.[0]}
                    alt={product.name}
                    className="h-64 w-full md:h-full md:min-h-[340px]"
                    fontSize={130}
                  />
                </div>

                {/* Copy */}
                <div className={cn("p-7 sm:p-10", reversed && "md:order-1")}>
                  <StarRating rating={product.rating} count={product.reviewCount} />
                  <h3 className="mt-2 text-2xl font-bold tracking-tight sm:text-[26px]">
                    <Link href={`/product/${product.slug}`} className="transition-colors hover:text-brand">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">
                    {product.shortDescription}
                  </p>

                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {product.benefits.slice(0, 4).map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-ink/80">
                        <span className="mt-0.5 text-brand">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Price price={product.price} salePrice={product.salePrice} showDiscount className="text-2xl" />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <AddToCartButton product={product} />
                    <Link href={`/product/${product.slug}`} className="btn btn-ghost">
                      View details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
