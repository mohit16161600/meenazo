import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { ShopView } from "@/components/shop/ShopView";
import { getCategories } from "@/lib/catalog";
import { buildSeoMetadata } from "@/lib/seo";

/**
 * Rendered per request.
 *
 * It listed products (and therefore prices) from a prerendered snapshot, and
 * combining that with dynamicParams = false was actively dangerous: a
 * revalidatePath on this route DELETED the prerendered pages, and with
 * dynamicParams = false nothing could regenerate them — every category 404ed
 * until the next build. Verified by reproducing it: all three categories
 * returned 200 on a fresh server and 404 after a single product save.
 *
 * Reading per request removes both the stale prices and that failure mode.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
  if (!category) {
    return buildSeoMetadata({ title: "Category", path: `/category/${slug}`, robots: "noindex, follow" });
  }
  // Panel-authored SEO copy wins; otherwise fall back to the category's own text.
  return buildSeoMetadata({
    ...category,
    title: category.name,
    description: category.longDescription || category.description,
    path: `/category/${category.slug}`,
    image: category.image,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = (await getCategories()).find((c) => c.slug === slug);
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
