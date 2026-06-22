import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { bestSellers } from "@/data/products";

/**
 * Home "Best sellers" section — the three customer favourites on a soft band.
 * Three-column grid on desktop, two on tablet, single column on mobile.
 */
export function BestSellers() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          eyebrow="Loved by customers"
          title="Best sellers"
          subtitle="The time-tested Ayurvedic formulas our community reaches for again and again."
          action={
            <Button variant="ghost" size="sm" href="/shop?sort=rating">
              Shop all
            </Button>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
