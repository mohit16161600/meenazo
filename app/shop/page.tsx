import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";
import { ShopView } from "@/components/shop/ShopView";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Shop All Products",
  description:
    "Browse the complete Meenazo apothecary — authentic Ayurvedic supplements for immunity, diabetes care, vitality, women's health and more. Filter by category, price and rating.",
  path: "/shop",
});

export default function ShopPage() {
  return (
    <>
      {/* Page hero */}
      <section className="bg-mint">
        <Container className="py-10 md:py-14">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop" }]} className="mb-4" />
          <span className="eyebrow">The Apothecary</span>
          <h2 className="mt-1.5">Shop all products</h2>
          <p className="text-muted mt-2 max-w-2xl">
            Pure, potent and clinically-inspired Ayurvedic formulations — crafted with time-honoured herbs and made for
            modern wellbeing.
          </p>
        </Container>
      </section>

      {/* Listing */}
      <section className="section-y">
        <Container>
          <Suspense fallback={<ProductGridSkeleton count={9} />}>
            <ShopView />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
