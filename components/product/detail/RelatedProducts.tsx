import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductCard";

/** "You may also like" — related/complementary products. */
export function RelatedProducts({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return null;

  return (
    <section className="section-y">
      <Container>
        <SectionHeader
          eyebrow="Complete your routine"
          title="You may also like"
          subtitle="Hand-picked Ayurvedic companions chosen by our wellness experts."
        />
        <ProductGrid products={products} className="!grid-cols-2 lg:!grid-cols-4" />
      </Container>
    </section>
  );
}
