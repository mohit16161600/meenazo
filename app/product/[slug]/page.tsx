import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGallery } from "@/components/product/detail/ProductGallery";
import { BuyBox } from "@/components/product/detail/BuyBox";
import { ProductStory } from "@/components/product/detail/ProductStory";
import { ProductTabs } from "@/components/product/detail/ProductTabs";
import { ProductReviews } from "@/components/product/detail/ProductReviews";
import { ProductFaq } from "@/components/product/detail/ProductFaq";
import { RelatedProducts } from "@/components/product/detail/RelatedProducts";
import { RecentlyViewed } from "@/components/product/detail/RecentlyViewed";
import { RecentlyViewedTracker } from "@/components/product/detail/RecentlyViewedTracker";
import { StickyMobileBuy } from "@/components/product/detail/StickyMobileBuy";
import { getProducts, getProductBySlug, getProductsByCategory } from "@/lib/catalog";
import { getCategoryBySlug } from "@/data/categories";
import { buildSeoMetadata, jsonLdScript } from "@/lib/seo";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  graph,
  productJsonLd,
  reviewsJsonLd,
} from "@/lib/schema";
import { effectivePrice } from "@/utils/format";
import { imgSrc } from "@/utils/image";
import type { Product } from "@/types";

/**
 * Rendered per request, not prerendered.
 *
 * This page carries the PRICE, and a prerendered copy of a price is the exact
 * bug this work exists to remove. Both cache-invalidation routes were tried
 * against a live build and both failed here while working everywhere else:
 * after a panel edit the homepage and the order total were correct within a
 * second, and /product/[slug] kept serving its build-time HTML — first with a
 * stale data cache, then, once that was gone, because revalidatePath does not
 * reliably reach a route built by generateStaticParams.
 *
 * So the page reads the catalogue on every request. The cost is one indexed
 * query per view (React de-duplicates the several reads within a single
 * render), which is a small price for never showing a number the checkout will
 * not honour.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildSeoMetadata({ title: "Product not found", robots: "noindex, follow" });

  // Spread the product's own SEO block, then hand over the natural fallbacks —
  // buildSeoMetadata decides which wins, so the rule lives in one place.
  return buildSeoMetadata({
    ...product,
    title: product.name,
    description: product.shortDescription,
    path: `/product/${product.slug}`,
    image: imgSrc(product.images?.[0]),
  });
}

/** Pick up to `limit` related products in the same category, fill from others. */
async function relatedFor(product: Product, limit = 4): Promise<Product[]> {
  const same = (await getProductsByCategory(product.category)).filter((p) => p.id !== product.id);
  if (same.length >= limit) return same.slice(0, limit);
  const fill = (await getProducts()).filter(
    (p) => p.id !== product.id && !same.some((s) => s.id === p.id)
  );
  return [...same, ...fill].slice(0, limit);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.category);
  const related = await relatedFor(product, 4);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
    { label: product.name },
  ];

  // One @graph so the page emits a single structured-data block instead of
  // several competing ones: the product, its reviews, the FAQ and the trail.
  const jsonLd = graph(
    productJsonLd({
      name: product.name,
      description: product.seoDescription ?? product.shortDescription,
      slug: product.slug,
      price: effectivePrice(product.price, product.salePrice),
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      images: product.images.map((i) => imgSrc(i)).filter(Boolean) as string[],
      sku: product.sku,
      brand: product.brand,
    }),
    reviewsJsonLd(product),
    faqJsonLd(product.faq ?? []),
    breadcrumbJsonLd(crumbs)
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />

      {/* Top: gallery + buy box */}
      <Container className="py-6 md:py-8 pb-28 lg:pb-8">
        <Breadcrumbs items={crumbs} className="mb-6 md:mb-8" />
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <ProductGallery product={product} />
          <BuyBox product={product} />
        </div>
      </Container>

      {/* Visual story — benefits, ingredients, how-to-use, promise */}
      <ProductStory product={product} />

      {/* Tabbed info — description / ingredients / benefits / directions */}
      <ProductTabs product={product} />

      {/* Reviews and FAQ each get their own full band (they used to be tabs) */}
      <ProductReviews product={product} />
      <ProductFaq product={product} />

      {/* Related + recently viewed */}
      <RelatedProducts products={related} />
      <RecentlyViewed currentId={product.id} />

      {/* Side-effects + mobile bar */}
      <RecentlyViewedTracker productId={product.id} />
      <StickyMobileBuy product={product} />
    </>
  );
}
