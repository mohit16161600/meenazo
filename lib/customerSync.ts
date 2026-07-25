"use client";

import { useWishlistStore } from "@/lib/store/wishlistStore";
import { useCartStore } from "@/lib/store/cartStore";
import { getProductById } from "@/data/products";

/**
 * On login, push the browser's local wishlist + cart to the server so the
 * customer's data lives in the DB keyed by their phone number. Best-effort:
 * failures never block the login.
 */
export async function pushLocalDataToServer(): Promise<void> {
  // Wishlist (enrich ids with slug/name for the panel view).
  try {
    const ids = useWishlistStore.getState().ids;
    if (ids.length) {
      const items = ids.map((id) => {
        const p = getProductById(id);
        return { productId: id, slug: p?.slug, name: p?.name };
      });
      await fetch("/api/customer/wishlist", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
    }
  } catch {
    /* ignore */
  }

  // Cart snapshot.
  await pushCartToServer();
}

/** Save the current cart to the server (also used on entering checkout). */
export async function pushCartToServer(): Promise<void> {
  try {
    const { items, coupon } = useCartStore.getState();
    if (!items.length) return;
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    await fetch("/api/customer/cart", {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, subtotal, couponCode: coupon?.code }),
    });
  } catch {
    /* ignore */
  }
}

/** Add/remove a single wishlist item on the server (when signed in). */
export async function syncWishlistToggle(
  added: boolean,
  item: { productId: string; slug?: string; name?: string }
): Promise<void> {
  try {
    await fetch("/api/customer/wishlist", {
      method: added ? "POST" : "DELETE",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  } catch {
    /* ignore — a 401 (not logged in) is expected for guests */
  }
}
