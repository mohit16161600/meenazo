"use client";

import { cn } from "@/utils/cn";
import { IconChevronLeft, IconChevronRight } from "@/components/ui/Icon";

/** Numeric pagination with prev/next. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const btn =
    "min-w-10 h-10 px-3 rounded-full text-sm font-semibold flex items-center justify-center transition-colors";

  return (
    <nav className={cn("flex items-center justify-center gap-2", className)} aria-label="Pagination">
      <button
        className={cn(btn, "border border-line hover:bg-soft disabled:opacity-40")}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <IconChevronLeft size={18} />
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(btn, p === page ? "bg-brand text-white" : "border border-line hover:bg-soft")}
          >
            {p}
          </button>
        )
      )}
      <button
        className={cn(btn, "border border-line hover:bg-soft disabled:opacity-40")}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <IconChevronRight size={18} />
      </button>
    </nav>
  );
}
