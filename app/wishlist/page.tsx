"use client";

import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useHydrated } from "@/hooks/useHydrated";
import { useToast } from "@/context/ToastContext";
import { getProductById } from "@/data/products";
import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGridSkeleton } from "@/components/product/ProductCardSkeleton";

/**
 * Wishlist page (fully client — reads the persisted wishlist store).
 * Guards rendering with useHydrated so SSR markup matches first client render.
 */
export default function WishlistPage() {
  const hydrated = useHydrated();
  const ids = useWishlistStore((s) => s.ids);
  const clear = useWishlistStore((s) => s.clear);
  const toast = useToast();

  // Resolve saved ids to live products (skip any that no longer exist).
  const products: Product[] = ids
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));

  const handleClear = () => {
    clear();
    toast.info("Wishlist cleared", "All saved items were removed.");
  };

  return (
    <section className="section-y">
      <Container>
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]}
          className="mb-4"
        />

        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <span className="eyebrow">Saved for later</span>
            <h2 className="mt-1.5">My wishlist</h2>
            {hydrated && products.length > 0 && (
              <p className="text-muted mt-2">
                {products.length} {products.length === 1 ? "item" : "items"} you&apos;re loving
              </p>
            )}
          </div>

          {hydrated && products.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-semibold text-muted hover:text-red-600 transition-colors shrink-0"
            >
              Clear wishlist
            </button>
          )}
        </div>

        {!hydrated ? (
          <ProductGridSkeleton count={3} />
        ) : products.length === 0 ? (
          <EmptyState
            emoji="🤍"
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it here. Build your perfect Ayurvedic routine and shop it whenever you're ready."
            actionLabel="Discover products"
            actionHref="/shop"
          />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
