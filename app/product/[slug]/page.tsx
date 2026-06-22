import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGallery } from "@/components/product/detail/ProductGallery";
import { BuyBox } from "@/components/product/detail/BuyBox";
import { ProductTabs } from "@/components/product/detail/ProductTabs";
import { RelatedProducts } from "@/components/product/detail/RelatedProducts";
import { RecentlyViewed } from "@/components/product/detail/RecentlyViewed";
import { RecentlyViewedTracker } from "@/components/product/detail/RecentlyViewedTracker";
import { StickyMobileBuy } from "@/components/product/detail/StickyMobileBuy";
import { products, getProductBySlug, getProductsByCategory } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import { buildMetadata, productJsonLd, jsonLdScript } from "@/lib/seo";
import { effectivePrice } from "@/utils/format";
import type { Product } from "@/types";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return buildMetadata({ title: "Product not found" });

  return buildMetadata({
    title: product.seoTitle ?? product.name,
    description: product.seoDescription ?? product.shortDescription,
    path: `/product/${product.slug}`,
  });
}

/** Pick up to `limit` related products in the same category, fill from others. */
function relatedFor(product: Product, limit = 4): Product[] {
  const same = getProductsByCategory(product.category).filter((p) => p.id !== product.id);
  if (same.length >= limit) return same.slice(0, limit);
  const fill = products.filter(
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
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.category);
  const related = relatedFor(product, 4);

  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(category ? [{ label: category.name, href: `/category/${category.slug}` }] : []),
    { label: product.name },
  ];

  const jsonLd = productJsonLd({
    name: product.name,
    description: product.seoDescription ?? product.shortDescription,
    slug: product.slug,
    price: effectivePrice(product.price, product.salePrice),
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
  });

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

      {/* Tabbed info */}
      <ProductTabs product={product} />

      {/* Related + recently viewed */}
      <RelatedProducts products={related} />
      <RecentlyViewed currentId={product.id} />

      {/* Side-effects + mobile bar */}
      <RecentlyViewedTracker productId={product.id} />
      <StickyMobileBuy product={product} />
    </>
  );
}
