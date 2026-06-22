"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import { filterProducts } from "@/services/productService";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { formatPrice, effectivePrice } from "@/utils/format";
import { categories } from "@/data/categories";
import { IconSearch, IconClose } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

/** Search input with live product suggestions. */
export function SearchBar({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 200);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = debounced.trim() ? filterProducts({ query: debounced, perPage: 5 }).items : [];
  const catMatches = debounced.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(debounced.toLowerCase())).slice(0, 3)
    : [];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  };

  const trending = ["Ashwagandha", "Diabetes", "Immunity", "Weight loss"];

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form
        onSubmit={submit}
        className="flex items-center gap-2 bg-soft border border-line rounded-full px-4 py-2.5 text-muted focus-within:border-brand transition-colors"
      >
        <IconSearch size={18} className="text-muted shrink-0" />
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Ayurvedic products…"
          className="bg-transparent outline-none text-sm w-full text-ink"
          aria-label="Search products"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} className="text-muted hover:text-ink shrink-0" aria-label="Clear">
            <IconClose size={16} />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-line rounded-2xl shadow-brand-lg overflow-hidden z-50 animate-fadeIn">
          {!debounced.trim() ? (
            <div className="p-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2.5">Trending</p>
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/shop?q=${encodeURIComponent(t)}`);
                    }}
                    className="chip chip-soft hover:bg-brand hover:text-white"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && catMatches.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted">No results for “{debounced}”.</div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              {catMatches.length > 0 && (
                <div className="p-2 border-b border-line">
                  {catMatches.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-soft text-sm"
                    >
                      <span>{c.emoji}</span>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted text-xs ml-auto">Category</span>
                    </Link>
                  ))}
                </div>
              )}
              {results.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-soft"
                >
                  <ArtPlaceholder emoji={p.emoji} gradient={p.gradient} src={p.images?.[0]} alt={p.name} className="w-11 h-11 rounded-lg" fontSize={22} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted truncate">{p.shortDescription}</p>
                  </div>
                  <span className="text-sm font-bold">{formatPrice(effectivePrice(p.price, p.salePrice))}</span>
                </Link>
              ))}
              <button
                onClick={submit}
                className="w-full text-center text-sm font-semibold text-brand py-3 hover:bg-soft border-t border-line"
              >
                View all results →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
