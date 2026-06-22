"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductCard";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";
import { useHydrated } from "@/hooks/useHydrated";
import { getProductById } from "@/data/products";
import type { Product } from "@/types";

/** Shows the visitor's recently viewed products (persisted), excluding current. */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const hydrated = useHydrated();
  const ids = useRecentlyViewedStore((s) => s.ids);

  if (!hydrated) return null;

  const items = ids
    .filter((id) => id !== currentId)
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p))
    .slice(0, 4);

  if (items.length === 0) return null;

  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader eyebrow="Pick up where you left off" title="Recently viewed" />
        <ProductGrid products={items} className="!grid-cols-2 lg:!grid-cols-4" />
      </Container>
    </section>
  );
}
