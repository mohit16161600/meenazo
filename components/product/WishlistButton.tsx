"use client";

import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useToast } from "@/context/ToastContext";
import { useHydrated } from "@/hooks/useHydrated";
import { IconHeart } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";
import { syncWishlistToggle } from "@/lib/customerSync";
import { useCatalog } from "@/components/catalog/CatalogProvider";

/** Heart toggle backed by the wishlist store. */
export function WishlistButton({
  productId,
  productName,
  className,
  size = 38,
}: {
  productId: string;
  productName?: string;
  className?: string;
  size?: number;
}) {
  const ids = useWishlistStore((s) => s.ids);
  const toggle = useWishlistStore((s) => s.toggle);
  const toast = useToast();
  const hydrated = useHydrated();
  const catalog = useCatalog();
  const active = hydrated && ids.includes(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
        // Persist to the DB when signed in (no-op / 401 for guests).
        const p = catalog.find((x) => String(x.id) === String(productId));
        void syncWishlistToggle(!active, { productId, slug: p?.slug, name: productName ?? p?.name });
        toast.success(
          active ? "Removed from wishlist" : "Added to wishlist",
          productName
        );
      }}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      style={{ width: size, height: size }}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 border border-line shadow-sm transition-all hover:scale-110",
        active && "border-transparent",
        className
      )}
    >
      <IconHeart filled={active} size={18} className={cn("transition-colors", active ? "text-red-500" : "text-ink/60")} />
    </button>
  );
}
