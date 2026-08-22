"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCartStore } from "@/lib/store/cartStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useToast } from "@/context/ToastContext";
import { getProductById } from "@/data/products";
import { syncWishlistToggle } from "@/lib/customerSync";
import { effectivePrice, formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

/**
 * Wishlist.
 * ---------------------------------------------------------------------------
 * Laid out as a saved-items DASHBOARD rather than a plain grid: a standing rail
 * on the left that says what the list is worth, and the items on the right with
 * the controls a wishlist actually needs — sort, view, move one or all to the
 * cart, and remove.
 *
 * Two rules run through it:
 *   • Remove is spelled out. The card's heart already toggles an item off, but
 *     on THIS page a filled heart reads as "saved", not "click to unsave".
 *   • Nothing is destructive without a way back. Every removal, including
 *     "Clear", is undoable from one banner — which is why no confirm dialog
 *     stands in the way of the common case.
 */

type SortKey = "recent" | "price-low" | "price-high" | "name";
type View = "grid" | "list";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
  { key: "name", label: "Name: A to Z" },
];

/** One figure in the left rail. */
function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="text-center sm:text-left">
      <span className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-mint text-brand">
        <Icon name={icon} size={19} />
      </span>
      <div className="text-[22px] font-extrabold leading-none text-ink">{value}</div>
      <div className="mt-1.5 text-[12px] font-medium text-muted">{label}</div>
    </div>
  );
}

export default function WishlistPage() {
  const hydrated = useHydrated();
  const ids = useWishlistStore((s) => s.ids);
  const removeId = useWishlistStore((s) => s.remove);
  const addId = useWishlistStore((s) => s.add);
  const clear = useWishlistStore((s) => s.clear);
  const addItem = useCartStore((s) => s.addItem);
  const toast = useToast();

  const [sort, setSort] = useState<SortKey>("recent");
  const [view, setView] = useState<View>("grid");
  /** What the last action took away, so it can be put back. */
  const [undo, setUndo] = useState<{ ids: string[]; label: string } | null>(null);

  // Resolve saved ids to live products (skip any that no longer exist).
  const saved: Product[] = useMemo(
    () => ids.map((id) => getProductById(id)).filter((p): p is Product => Boolean(p)),
    [ids]
  );

  const products = useMemo(() => {
    const list = [...saved];
    switch (sort) {
      // The store appends, so the newest id is last — "recent" is that reversed.
      case "recent":
        return list.reverse();
      case "price-low":
        return list.sort((a, b) => effectivePrice(a.price, a.salePrice) - effectivePrice(b.price, b.salePrice));
      case "price-high":
        return list.sort((a, b) => effectivePrice(b.price, b.salePrice) - effectivePrice(a.price, a.salePrice));
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [saved, sort]);

  const payable = saved.reduce((n, p) => n + effectivePrice(p.price, p.salePrice), 0);
  const listTotal = saved.reduce((n, p) => n + p.price, 0);
  const saving = Math.max(0, listTotal - payable);
  const onSale = saved.filter((p) => p.salePrice != null && p.salePrice < p.price).length;
  const pad = (n: number) => String(n).padStart(2, "0");

  /** Drop one id everywhere: local store first, then the signed-in customer's row. */
  function forget(product: Product) {
    removeId(product.id);
    void syncWishlistToggle(false, { productId: product.id, slug: product.slug, name: product.name });
  }

  function removeOne(product: Product) {
    forget(product);
    setUndo({ ids: [product.id], label: `${product.name} removed from your wishlist` });
  }

  function moveToCart(product: Product) {
    addItem(product, 1);
    forget(product);
    setUndo({ ids: [product.id], label: `${product.name} moved to your cart` });
    toast.success("Moved to cart", product.name);
  }

  function moveAllToCart() {
    const moved = [...ids];
    saved.forEach((p) => {
      addItem(p, 1);
      forget(p);
    });
    setUndo({ ids: moved, label: `${moved.length} ${moved.length === 1 ? "item" : "items"} moved to your cart` });
    toast.success(`${moved.length} ${moved.length === 1 ? "item" : "items"} added to cart`, "Your wishlist is now empty.");
  }

  function handleClear() {
    const removed = [...ids];
    clear();
    // No bulk endpoint — the server row for each item goes one at a time.
    removed.forEach((id) => {
      const p = getProductById(id);
      void syncWishlistToggle(false, { productId: id, slug: p?.slug, name: p?.name });
    });
    setUndo({ ids: removed, label: `Wishlist cleared — ${removed.length} items removed` });
  }

  function handleUndo() {
    if (!undo) return;
    undo.ids.forEach((id) => {
      addId(id);
      const p = getProductById(id);
      void syncWishlistToggle(true, { productId: id, slug: p?.slug, name: p?.name });
    });
    setUndo(null);
    toast.success("Restored", "Back in your wishlist.");
  }

  /** The remove control that sits beside each card's own "Add to cart". */
  const removeButton = (p: Product) => (
    <button
      type="button"
      onClick={() => removeOne(p)}
      aria-label={`Remove ${p.name} from wishlist`}
      title="Remove from wishlist"
      className="flex w-11 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
    >
      <Icon name="trash" size={17} />
    </button>
  );

  return (
    <section className="section-y">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} className="mb-5" />

        <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-10">
          {/* ------------------------- Left rail ------------------------- */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-brand bg-mint/50 p-6 sm:p-7">
              {/* Decorative leaf, pushed well behind the text and hidden from
                  screen readers — it is mood, not content. */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-6 -right-4 select-none text-[110px] leading-none text-brand/10"
              >
                🌿
              </span>

              <div className="relative">
                <span className="eyebrow">Saved for later</span>
                <h1 className="mt-2 text-[34px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[38px]">
                  My <span className="text-brand">Wishlist</span>
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">
                  Everything you&apos;ve saved, in one place — ready whenever you are.
                </p>

                {hydrated && saved.length > 0 && (
                  <>
                    <div className="mt-7 grid grid-cols-3 gap-3 border-t border-brand/15 pt-6">
                      <Stat icon="heart" value={pad(saved.length)} label="Items saved" />
                      <Stat icon="bag" value={formatPrice(payable)} label="Total value" />
                      <Stat icon="tag" value={pad(onSale)} label="On sale" />
                    </div>

                    {saving > 0 && (
                      <p className="mt-5 rounded-xl bg-white/70 px-3.5 py-2.5 text-[13px] font-semibold text-brand-dark">
                        You&apos;re saving {formatPrice(saving)} on this list
                      </p>
                    )}

                    <p className="mt-4 flex items-start gap-1.5 text-[12px] leading-snug text-muted">
                      <Icon name="lock" size={13} className="mt-0.5 shrink-0" />
                      Prices and availability can change until you order.
                    </p>
                  </>
                )}
              </div>
            </div>
          </aside>

          {/* --------------------------- Items --------------------------- */}
          <div className="min-w-0">
            {/* The undo line sits OUTSIDE the has-items branch on purpose.
                Inside it, "Clear wishlist" and "Move all to cart" empty the
                list, the empty state takes over, and the banner unmounts in the
                same render — so Undo disappeared at exactly the moment it was
                the only way back. */}
            {hydrated && undo && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-brand border border-line bg-soft/70 px-4 py-3">
                <span className="text-sm text-ink">{undo.label}</span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleUndo} className="text-sm font-bold text-brand hover:underline">
                    Undo
                  </button>
                  <button
                    type="button"
                    onClick={() => setUndo(null)}
                    aria-label="Dismiss"
                    className="text-muted transition-colors hover:text-ink"
                  >
                    <Icon name="x" size={16} />
                  </button>
                </div>
              </div>
            )}

            {!hydrated ? (
              <ProductGridSkeleton count={4} />
            ) : saved.length === 0 ? (
              <EmptyState
                emoji="🤍"
                title="Your wishlist is empty"
                message="Tap the heart on any product to save it here. Build your perfect Ayurvedic routine and shop it whenever you're ready."
                actionLabel="Discover products"
                actionHref="/shop"
              />
            ) : (
              <>
                {/* Toolbar: count, sort, view, bulk action. */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="text-[15px] font-bold text-ink">
                    {saved.length} {saved.length === 1 ? "item" : "items"}
                  </span>

                  <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">
                    <span className="hidden sm:inline">Sort by</span>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      aria-label="Sort wishlist"
                      className="min-h-[42px] rounded-full border border-line bg-white px-4 text-[13px] font-semibold text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
                    >
                      {SORTS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Grid/list uses ProductCard's own two layouts. */}
                  <div className="hidden items-center rounded-full border border-line bg-white p-1 sm:flex">
                    {(["grid", "list"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        aria-label={`${v} view`}
                        aria-pressed={view === v}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                          view === v ? "bg-brand text-white" : "text-muted hover:text-ink"
                        )}
                      >
                        <Icon name={v === "grid" ? "package" : "clipboard-check"} size={16} />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={moveAllToCart}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-dark"
                  >
                    <Icon name="cart" size={16} /> Move all to cart
                  </button>
                </div>

                <div
                  className={cn(
                    view === "grid"
                      ? "grid grid-cols-2 gap-5 xl:grid-cols-3 md:gap-6"
                      : "flex flex-col gap-4"
                  )}
                >
                  {products.map((p) =>
                    view === "grid" ? (
                      <ProductCard key={p.id} product={p} footer={removeButton(p)} />
                    ) : (
                      // The list card has no footer slot, so its controls sit
                      // under it rather than being squeezed into the row.
                      <div key={p.id}>
                        <ProductCard product={p} view="list" />
                        <div className="mt-2 flex items-center gap-4 px-1">
                          <button
                            type="button"
                            onClick={() => moveToCart(p)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand-dark"
                          >
                            <Icon name="cart" size={14} /> Move to cart
                          </button>
                          <button
                            type="button"
                            onClick={() => removeOne(p)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition-colors hover:text-red-600"
                          >
                            <Icon name="trash" size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Closing nudge + the only destructive control, kept apart from
                    the items so it is never a mis-click. */}
                <div className="mt-8 flex flex-wrap items-center gap-4 rounded-brand border border-line bg-soft/60 px-5 py-5">
                  <span className="text-3xl" aria-hidden>
                    🎁
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink">Don&apos;t want to lose these?</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      A wishlist doesn&apos;t hold stock. Move them to your cart to check out sooner.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href="/shop"
                      className="inline-flex min-h-[42px] items-center rounded-full border border-line bg-white px-5 text-[13px] font-bold text-ink transition-colors hover:border-brand/40 hover:bg-mint"
                    >
                      Keep shopping
                    </Link>
                    <button
                      type="button"
                      onClick={handleClear}
                      className="text-[13px] font-semibold text-muted transition-colors hover:text-red-600"
                    >
                      Clear wishlist
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
