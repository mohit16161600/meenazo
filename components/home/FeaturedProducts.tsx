import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/product/ProductCard";
import { featuredProducts } from "@/data/products";

/**
 * Home "Featured formulas" section — a handpicked selection on a white band.
 * Capped to six products and rendered in the shared responsive ProductGrid.
 */
export function FeaturedProducts() {
  const products = featuredProducts.slice(0, 6);

  return (
    <section className="section-y">
      <Container>
        <SectionHeader
          eyebrow="Handpicked"
          title="Featured formulas"
          subtitle="Carefully chosen blends, crafted with pure herbs and balanced by traditional wisdom."
          action={
            <Button variant="ghost" size="sm" href="/shop">
              Shop all
            </Button>
          }
        />
        <ProductGrid products={products} />
      </Container>
    </section>
  );
}
