"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { apiGet } from "../_lib/api";
import { clsx } from "clsx";

interface Hit {
  group: "orders" | "customers" | "products";
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

const GROUP_LABEL: Record<Hit["group"], string> = {
  orders: "Orders",
  customers: "Customers",
  products: "Products",
};
const GROUP_ICON: Record<Hit["group"], string> = {
  orders: "shopping-bag",
  customers: "users",
  products: "box",
};

/**
 * Panel-wide search: order number, customer name/phone/email, product name/SKU.
 * Debounced so typing doesn't fire a query per keystroke, and keyboard-driven
 * (↑/↓/Enter/Esc) so it can be used without reaching for the mouse.
 */
export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      apiGet<{ hits: Hit[] }>(`/search?q=${encodeURIComponent(term)}`)
        .then((r) => {
          setHits(r.hits ?? []);
          setCursor(0);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  // Close on outside click; "/" from anywhere focuses the box.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(hit: Hit) {
    setOpen(false);
    setQ("");
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    // Escape closes the overlay and hands focus back to the field (rule: an
    // overlay must always be dismissable from the keyboard).
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.focus();
      return;
    }
    if (!hits.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(hits[cursor]);
    }
  }

  let lastGroup = "";

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Icon name="search" size={16} />
        </span>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search orders, customers, products…"
          aria-label="Search the panel"
          role="combobox"
          aria-expanded={open && q.trim().length >= 2}
          aria-controls="panel-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          className="min-h-[44px] w-full rounded-xl border border-line bg-white py-2 pl-9 pr-10 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25 placeholder:text-muted/60"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-soft hover:text-ink"
          >
            <Icon name="x" size={14} />
          </button>
        ) : (
          <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-soft px-1.5 py-0.5 text-[10px] font-semibold text-muted sm:block">
            /
          </kbd>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div
          id="panel-search-results"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-line bg-white shadow-brand-lg"
        >
          {loading && hits.length === 0 && <p className="px-4 py-3 text-sm text-muted">Searching…</p>}
          {!loading && hits.length === 0 && (
            <p className="px-4 py-3 text-sm text-muted">
              Nothing matched “{q.trim()}”. Try an order number, phone or product name.
            </p>
          )}
          {hits.map((h, i) => {
            const header = h.group !== lastGroup ? ((lastGroup = h.group), GROUP_LABEL[h.group]) : null;
            return (
              <div key={`${h.group}-${h.id}`}>
                {header && (
                  <div className="border-b border-line bg-soft/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                    {header}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={i === cursor}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(h)}
                  className={clsx(
                    "flex min-h-[44px] w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
                    i === cursor ? "bg-mint" : "hover:bg-soft"
                  )}
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-soft text-brand">
                    <Icon name={GROUP_ICON[h.group]} size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{h.title}</span>
                    {h.subtitle && <span className="block truncate text-xs text-muted">{h.subtitle}</span>}
                  </span>
                  {h.meta && <span className="flex-none text-xs text-muted">{h.meta}</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
