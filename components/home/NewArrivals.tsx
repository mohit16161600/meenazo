import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { newArrivals } from "@/data/products";

/**
 * Home "New arrivals" section on a soft band.
 * Desktop: responsive grid. Mobile: a horizontal scroll-snap carousel so the
 * latest launches stay scannable without crowding the small screen.
 */
export function NewArrivals() {
  const products = newArrivals.slice(0, 6);

  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          eyebrow="Just in"
          title="New arrivals"
          subtitle="Fresh additions to the apothecary — the newest ways to nurture your daily ritual."
          action={
            <Button variant="ghost" size="sm" href="/shop?sort=newest">
              Shop all
            </Button>
          }
        />

        {/* Mobile: horizontal scroll-snap row */}
        <div className="sm:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 snap-x snap-mandatory pb-1">
            {products.map((product) => (
              <div key={product.id} className="snap-start shrink-0 min-w-[260px] w-[260px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Tablet & desktop: grid */}
        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  );
}
