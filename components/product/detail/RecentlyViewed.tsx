"use client";

import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductCard";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewedStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useCatalog } from "@/components/catalog/CatalogProvider";
import type { Product } from "@/types";

/** Shows the visitor's recently viewed products (persisted), excluding current. */
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const hydrated = useHydrated();
  const ids = useRecentlyViewedStore((s) => s.ids);
  // Hooks must run before any early return, so this sits above the guard.
  const catalog = useCatalog();

  if (!hydrated) return null;

  const items = ids
    .filter((id) => id !== currentId)
    .map((id) => catalog.find((p) => String(p.id) === String(id)))
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
