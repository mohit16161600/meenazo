import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { ShopView } from "@/components/shop/ShopView";
import { categories, getCategoryBySlug } from "@/data/categories";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

// Categories are fully enumerable — any unknown slug is a real 404 (no soft-404).
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) {
    return buildMetadata({ title: "Category", path: `/category/${slug}` });
  }
  return buildMetadata({
    title: category.name,
    description: category.longDescription ?? category.description,
    path: `/category/${category.slug}`,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <>
      {/* Category hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${category.gradient[0]}, ${category.gradient[1]})`,
        }}
      >
        <Container className="py-12 md:py-16">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Shop", href: "/shop" },
              { label: category.name },
            ]}
            className="mb-5"
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 md:gap-7">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-brand bg-white/70 backdrop-blur flex items-center justify-center text-5xl md:text-6xl shadow-brand shrink-0"
              aria-hidden
            >
              {category.emoji}
            </div>
            <div className="max-w-2xl">
              <span className="eyebrow">Category</span>
              <h2 className="mt-1.5">{category.name}</h2>
              <p className="text-ink/70 mt-2.5 text-[15px] leading-relaxed">
                {category.longDescription ?? category.description}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Listing filtered to this category */}
      <section className="section-y">
        <Container>
          <Suspense fallback={<ProductGridSkeleton count={9} />}>
            <ShopView initialCategory={category.slug} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
