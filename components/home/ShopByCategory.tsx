import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { categories } from "@/data/categories";

/** Browse-by-category grid linking to each category landing page. */
export function ShopByCategory() {
  return (
    <section className="section-y">
      <Container>
        <SectionHeader
          eyebrow="Browse"
          title="Shop by category"
          subtitle="Find the right Ayurvedic formulation for your wellness goal, backed by time-honoured herbs."
          action={
            <Button href="/shop" variant="ghost" size="sm">
              View all
            </Button>
          }
        />

        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="card-surface card-hover flex flex-col items-center p-5 text-center sm:p-6"
              aria-label={`${category.name} — ${category.productCount} products`}
            >
              <ArtPlaceholder
                emoji={category.emoji}
                gradient={category.gradient}
                className="h-20 w-20 rounded-full sm:h-24 sm:w-24"
                fontSize={40}
              />
              <h3 className="mt-4 text-[15px] font-bold text-ink sm:text-base">
                {category.name}
              </h3>
              <p className="mt-1 text-[13px] text-muted">
                {category.productCount > 0
                  ? `${category.productCount} product${category.productCount > 1 ? "s" : ""}`
                  : category.description}
              </p>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
