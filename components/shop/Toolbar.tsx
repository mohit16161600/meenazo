"use client";

import type { SortOption } from "@/types";
import { SORT_LABELS } from "@/utils/constants";
import { cn } from "@/utils/cn";

interface ToolbarProps {
  total: number;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onOpenFilters: () => void;
}

const sortOptions = Object.entries(SORT_LABELS) as [SortOption, string][];

/** Result count + sort select + grid/list toggle + mobile filters trigger. */
export function Toolbar({ total, sort, onSortChange, view, onViewChange, onOpenFilters }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Result count */}
      <p className="text-sm text-muted order-1">
        Showing <span className="font-semibold text-ink">{total}</span> {total === 1 ? "product" : "products"}
      </p>

      <div className="flex items-center gap-2.5 ml-auto order-2">
        {/* Mobile filters button */}
        <button
          type="button"
          onClick={onOpenFilters}
          className="lg:hidden btn btn-ghost btn-sm"
          aria-label="Open filters"
        >
          <span aria-hidden>⚙️</span> Filters
        </button>

        {/* Sort */}
        <div className="relative">
          <label htmlFor="shop-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-white border border-line rounded-full pl-4 pr-9 py-2 text-sm font-medium text-ink cursor-pointer hover:border-brand focus:border-brand focus:outline-none transition-colors"
          >
            {sortOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-muted" aria-hidden>
            ▼
          </span>
        </div>

        {/* View toggle */}
        <div className="hidden sm:flex items-center bg-soft border border-line rounded-full p-1" role="group" aria-label="View mode">
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
            className={cn(
              "w-9 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
              view === "grid" ? "bg-white shadow-brand text-brand" : "text-muted hover:text-ink"
            )}
          >
            ▦
          </button>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
            className={cn(
              "w-9 h-8 rounded-full flex items-center justify-center text-sm transition-colors",
              view === "list" ? "bg-white shadow-brand text-brand" : "text-muted hover:text-ink"
            )}
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  );
}
