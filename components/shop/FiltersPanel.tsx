"use client";

import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { cn } from "@/utils/cn";
import { formatPrice } from "@/utils/format";

export interface ShopFilters {
  categories: string[];
  price: [number, number];
  minRating: number;
  inStock: boolean;
  sale: boolean;
}

interface FiltersPanelProps {
  values: ShopFilters;
  priceBounds: { min: number; max: number };
  onToggleCategory: (slug: string) => void;
  onPriceChange: (price: [number, number]) => void;
  onRatingChange: (rating: number) => void;
  onInStockChange: (value: boolean) => void;
  onSaleChange: (value: boolean) => void;
  onClear: () => void;
  className?: string;
}

/** Count of products per category (derived from the catalogue, not the static field). */
const categoryCounts: Record<string, number> = products.reduce<Record<string, number>>((acc, p) => {
  acc[p.category] = (acc[p.category] ?? 0) + 1;
  return acc;
}, {});

const ratingOptions = [4, 3, 2] as const;

/** A labelled filter section with a heading. */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-5 border-b border-line last:border-0">
      <h3 className="text-sm font-bold text-ink mb-3.5">{title}</h3>
      {children}
    </div>
  );
}

/** Presentational filter sidebar. All state is lifted to the parent ShopView. */
export function FiltersPanel({
  values,
  priceBounds,
  onToggleCategory,
  onPriceChange,
  onRatingChange,
  onInStockChange,
  onSaleChange,
  onClear,
  className,
}: FiltersPanelProps) {
  const [minPrice, maxPrice] = values.price;

  const setMin = (raw: number) => {
    const clamped = Math.min(Math.max(priceBounds.min, raw), maxPrice);
    onPriceChange([clamped, maxPrice]);
  };
  const setMax = (raw: number) => {
    const clamped = Math.max(Math.min(priceBounds.max, raw), minPrice);
    onPriceChange([minPrice, clamped]);
  };

  return (
    <div className={cn("card-surface p-5", className)}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="text-base font-bold">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Categories */}
      <FilterSection title="Category">
        <ul className="space-y-2.5">
          {categories.map((cat) => {
            const checked = values.categories.includes(cat.slug);
            const count = categoryCounts[cat.slug] ?? 0;
            return (
              <li key={cat.id}>
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(cat.slug)}
                    className="w-4 h-4 rounded border-line text-brand accent-brand cursor-pointer"
                  />
                  <span className="text-base leading-none" aria-hidden>
                    {cat.emoji}
                  </span>
                  <span
                    className={cn(
                      "text-sm flex-1 transition-colors group-hover:text-brand",
                      checked ? "text-ink font-semibold" : "text-muted"
                    )}
                  >
                    {cat.name}
                  </span>
                  <span className="text-xs text-muted tabular-nums">{count}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price range">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="label" htmlFor="filter-min-price">
              Min
            </label>
            <input
              id="filter-min-price"
              type="number"
              inputMode="numeric"
              min={priceBounds.min}
              max={maxPrice}
              value={minPrice}
              onChange={(e) => setMin(Number(e.target.value))}
              className="field"
              aria-label="Minimum price"
            />
          </div>
          <span className="pb-3 text-muted">–</span>
          <div className="flex-1">
            <label className="label" htmlFor="filter-max-price">
              Max
            </label>
            <input
              id="filter-max-price"
              type="number"
              inputMode="numeric"
              min={minPrice}
              max={priceBounds.max}
              value={maxPrice}
              onChange={(e) => setMax(Number(e.target.value))}
              className="field"
              aria-label="Maximum price"
            />
          </div>
        </div>
        <p className="text-xs text-muted mt-2.5">
          {formatPrice(minPrice)} – {formatPrice(maxPrice)}
        </p>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Customer rating">
        <ul className="space-y-2.5">
          {ratingOptions.map((r) => {
            const active = values.minRating === r;
            return (
              <li key={r}>
                <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                  <input
                    type="radio"
                    name="filter-rating"
                    checked={active}
                    onChange={() => onRatingChange(active ? 0 : r)}
                    onClick={() => active && onRatingChange(0)}
                    className="w-4 h-4 border-line text-brand accent-brand cursor-pointer"
                  />
                  <span className="text-gold text-sm tracking-tight" aria-hidden>
                    {"★".repeat(r)}
                    <span className="text-line">{"★".repeat(5 - r)}</span>
                  </span>
                  <span
                    className={cn(
                      "text-sm transition-colors group-hover:text-brand",
                      active ? "text-ink font-semibold" : "text-muted"
                    )}
                  >
                    {r} & up
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Availability & offers */}
      <FilterSection title="Availability">
        <div className="space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={values.inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="w-4 h-4 rounded border-line text-brand accent-brand cursor-pointer"
            />
            <span
              className={cn(
                "text-sm transition-colors group-hover:text-brand",
                values.inStock ? "text-ink font-semibold" : "text-muted"
              )}
            >
              In stock only
            </span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer group select-none">
            <input
              type="checkbox"
              checked={values.sale}
              onChange={(e) => onSaleChange(e.target.checked)}
              className="w-4 h-4 rounded border-line text-brand accent-brand cursor-pointer"
            />
            <span
              className={cn(
                "text-sm transition-colors group-hover:text-brand",
                values.sale ? "text-ink font-semibold" : "text-muted"
              )}
            >
              On sale
            </span>
          </label>
        </div>
      </FilterSection>
    </div>
  );
}
