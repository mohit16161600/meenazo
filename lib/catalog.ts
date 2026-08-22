import { cache } from "react";
import { revalidateTag, revalidatePath } from "next/cache";
import type { Product, Category } from "@/types";
import { MODELS } from "./panelModels";
import { listRows } from "./panelCrud";
import { products as fallbackProducts } from "@/data/products";
import { categories as fallbackCategories } from "@/data/categories";
import { CATALOG_TAG, onCatalogBust } from "./catalogTag";

/**
 * The live catalogue — one source of truth for what the shop sells.
 * ---------------------------------------------------------------------------
 * The storefront used to render prices from `data/generated/products.json`,
 * which `data/products.ts` pulls in with a STATIC import. A static import is
 * resolved when the bundle is compiled, so pressing Publish rewrote that file
 * while the running server kept serving the numbers it was built with — prices
 * only moved on a redeploy, and in the meantime the shop displayed one figure
 * while lib/orderCapture charged another (it has always priced from the DB).
 *
 * Reading here at REQUEST time removes that gap: the panel row is what the
 * customer sees and what the customer is charged.
 *
 * Cost is bounded by Next's own page cache: storefront pages are cached HTML
 * and only re-render when a catalogue write invalidates them, so the database
 * is read once per regeneration rather than once per visitor. See the note
 * below on why there is deliberately no cache inside this module.
 *
 * The static files stay as the FALLBACK. An empty table or an unreachable
 * database must not empty the shop, so both readers below fall through to
 * `data/*.ts` exactly as the order pipeline already does.
 *
 * SERVER ONLY. It reaches the database through lib/panelCrud, so importing it
 * from a "use client" file would drag mysql2 into the browser bundle and fail
 * the build. Client components receive the catalogue as props instead — see
 * components/catalog/CatalogProvider.tsx.
 */

/** Cache tag every catalogue read is filed under; Publish invalidates it. */
export { CATALOG_TAG } from "./catalogTag";

/**
 * NO cross-request cache lives in this module, on purpose.
 *
 * Two earlier attempts each failed the same live test, in different ways.
 * `unstable_cache` kept handing back old rows even after the page had been
 * forced to re-render. A module-level TTL cache failed for a subtler reason:
 * Next bundles route handlers and pages separately, so the panel API that
 * cleared the cache and the product page that read it held DIFFERENT instances
 * of this module — clearing one never touched the other. The symptom was
 * precise and easy to miss: the homepage and the ORDER PRICE were both correct
 * while /product/[slug] kept showing the old number.
 *
 * React's `cache` is scoped to one render pass, so it de-duplicates the several
 * reads a single page makes and never survives into the next request. Caching
 * across requests is Next's job: storefront pages are cached HTML that only
 * re-renders when revalidateStorefront() invalidates it, so the database is
 * read once per regeneration rather than once per visitor.
 */

/** Published and sellable. `undefined` counts as active (see types/index.ts). */
function sellable<T extends { active?: boolean }>(rows: T[]): T[] {
  return rows.filter((r) => r.active !== false);
}

async function readProducts(): Promise<Product[]> {
  try {
    const { items } = await listRows(MODELS.products);
    // Authoritative on the RAW row count, with `active` applied after — the
    // same rule lib/orderCapture.loadCatalog uses. Filtering first would mean
    // "every product deactivated" fell through to the static file and made
    // them all buyable again, the exact opposite of switching them off.
    if (items.length) return sellable(items as unknown as Product[]);
  } catch {
    /* database unreachable → fall back rather than show an empty shop */
  }
  return sellable(fallbackProducts);
}

async function readCategories(): Promise<Category[]> {
  try {
    const { items } = await listRows(MODELS.categories);
    if (items.length) return sellable(items as unknown as Category[]);
  } catch {
    /* as above */
  }
  return sellable(fallbackCategories);
}

/** Every sellable product, live from the panel database. */
export const getProducts = cache(readProducts);

/** Every active category, live from the panel database. */
export const getCategories = cache(readCategories);
/**
 * Everything a catalogue change has to invalidate.
 *
 * Deliberately just the layout. Calling revalidatePath on a ROUTE PATTERN —
 * revalidatePath("/category/[slug]", "page") — looked like the way to reach
 * prerendered dynamic routes, and it did reach them: it deleted the
 * prerendered pages, and because those routes also declared
 * `dynamicParams = false`, nothing could regenerate them. Every category page
 * then returned 404 until the next build. Reproduced exactly: three categories
 * served 200 on a fresh server and 404 after a single product save.
 *
 * The pages that show prices are request-rendered instead (see the notes on
 * app/product/[slug] and app/category/[slug]), so they need no invalidation at
 * all, and this call only has to refresh the cached ones — home and shop.
 */
function revalidateStorefront(): void {
  try {
    revalidateTag(CATALOG_TAG);
    revalidatePath("/", "layout");
  } catch (err) {
    // Revalidation is a cache hint, never the point of the write.
    console.error("[catalog] revalidation failed:", (err as Error)?.message);
  }
}

// Writers fire the bust signal through lib/catalogTag (see the note there) —
// registering here is what connects that signal to the caches and the pages.
onCatalogBust(revalidateStorefront);

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug);
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => String(p.id) === String(id));
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  return (await getProducts()).filter((p) => p.category === slug);
}

/* --------------------------- Homepage selections ---------------------------
 * These mirror the derived exports in data/products.ts, but as FUNCTIONS. The
 * originals are module-level constants — evaluated once when the bundle loads,
 * which is precisely why the homepage kept showing build-time prices however
 * often the panel was edited. */

/** Best sellers, falling back to top-rated so the section is never empty. */
export async function getBestSellers(limit = 3): Promise<Product[]> {
  const all = await getProducts();
  const flagged = all.filter((p) => p.isBestSeller);
  const list = flagged.length ? flagged : [...all].sort((a, b) => b.rating - a.rating);
  return list.slice(0, limit);
}

/** Featured products, falling back to the whole catalogue. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const all = await getProducts();
  const flagged = all.filter((p) => p.isFeatured);
  return (flagged.length ? flagged : all).slice(0, limit);
}

/** Newest first, by the flag when set and by creation date otherwise. */
export async function getNewArrivals(limit = 6): Promise<Product[]> {
  const all = await getProducts();
  const flagged = all.filter((p) => p.isNewArrival);
  const list = flagged.length ? flagged : all;
  return [...list]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit);
}

/**
 * Drop the cached catalogue so the very next request re-reads the database.
 * Called by Publish; safe to call from anywhere on the server.
 */
export function revalidateCatalog(): void {
  revalidateStorefront();
}
