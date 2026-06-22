"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SortOption } from "@/types";
import { filterProducts, getPriceRange } from "@/services/productService";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard, ProductGrid } from "@/components/product/ProductCard";
import { FiltersPanel, type ShopFilters } from "./FiltersPanel";
import { Toolbar } from "./Toolbar";

const PRICE_BOUNDS = getPriceRange();

const defaultFilters = (initialCategory?: string): ShopFilters => ({
  categories: initialCategory ? [initialCategory] : [],
  price: [PRICE_BOUNDS.min, PRICE_BOUNDS.max],
  minRating: 0,
  inStock: false,
  sale: false,
});

/** Main shop listing experience: filters + toolbar + results + pagination. */
export function ShopView({ initialCategory }: { initialCategory?: string }) {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";

  const [filters, setFilters] = useState<ShopFilters>(() => defaultFilters(initialCategory));
  const [sort, setSort] = useState<SortOption>("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep the category in sync if the route changes to a different category page.
  useEffect(() => {
    setFilters(defaultFilters(initialCategory));
    setPage(1);
  }, [initialCategory]);

  // A new search term resets pagination so users land on the first page of hits.
  useEffect(() => {
    setPage(1);
  }, [query]);

  const isFullPriceRange =
    filters.price[0] <= PRICE_BOUNDS.min && filters.price[1] >= PRICE_BOUNDS.max;

  const result = useMemo(
    () =>
      filterProducts({
        query: query || undefined,
        categories: filters.categories.length ? filters.categories : undefined,
        minPrice: isFullPriceRange ? undefined : filters.price[0],
        maxPrice: isFullPriceRange ? undefined : filters.price[1],
        minRating: filters.minRating || undefined,
        inStock: filters.inStock || undefined,
        tags: filters.sale ? ["sale"] : undefined,
        sort,
        page,
      }),
    [query, filters, isFullPriceRange, sort, page]
  );

  // Guard against a page index left dangling after filters shrink the result set.
  useEffect(() => {
    if (page > result.totalPages) setPage(result.totalPages);
  }, [page, result.totalPages]);

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minRating > 0 ||
    filters.inStock ||
    filters.sale ||
    !isFullPriceRange;

  const update = (patch: Partial<ShopFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const filterPanel = (
    <FiltersPanel
      values={filters}
      priceBounds={PRICE_BOUNDS}
      onToggleCategory={(slug) =>
        update({
          categories: filters.categories.includes(slug)
            ? filters.categories.filter((c) => c !== slug)
            : [...filters.categories, slug],
        })
      }
      onPriceChange={(price) => update({ price })}
      onRatingChange={(minRating) => update({ minRating })}
      onInStockChange={(inStock) => update({ inStock })}
      onSaleChange={(sale) => update({ sale })}
      onClear={() => update(defaultFilters(initialCategory))}
    />
  );

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6 lg:gap-8 items-start">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-24" aria-label="Product filters">
        {filterPanel}
      </aside>

      {/* Results column */}
      <div>
        {query && (
          <p className="mb-4 text-sm text-muted">
            Results for <span className="font-semibold text-ink">“{query}”</span>
          </p>
        )}

        <Toolbar
          total={result.total}
          sort={sort}
          onSortChange={(s) => {
            setSort(s);
            setPage(1);
          }}
          view={view}
          onViewChange={setView}
          onOpenFilters={() => setDrawerOpen(true)}
        />

        {result.total === 0 ? (
          <div className="card-surface">
            <EmptyState
              emoji="🌿"
              title="No products found"
              message={
                query
                  ? `We couldn't find anything matching “${query}”. Try a different search or adjust your filters.`
                  : "No products match your current filters. Try broadening your selection."
              }
            >
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => update(defaultFilters(initialCategory))}
                  className="btn"
                >
                  Clear filters
                </button>
              )}
            </EmptyState>
          </div>
        ) : view === "list" ? (
          <div className="space-y-5 animate-fadeIn">
            {result.items.map((product) => (
              <ProductCard key={product.id} product={product} view="list" />
            ))}
          </div>
        ) : (
          <ProductGrid products={result.items} className="animate-fadeIn" />
        )}

        {result.total > 0 && (
          <div className="mt-10">
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onPageChange={(p) => {
                setPage(p);
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      <Modal open={drawerOpen} onClose={() => setDrawerOpen(false)} size="md">
        <div className="p-4 lg:hidden">
          {filterPanel}
          <button type="button" onClick={() => setDrawerOpen(false)} className="btn btn-block mt-4">
            Show {result.total} {result.total === 1 ? "result" : "results"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
