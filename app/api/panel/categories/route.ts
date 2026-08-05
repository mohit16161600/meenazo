import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { collectionHandlers, requireAccess } from "@/lib/panelCrud";
import { getSession } from "@/lib/panelAuth";
import { canAccess } from "@/lib/panelRoles";
import { MODELS } from "@/lib/panelModels";
import { rowToApi } from "@/lib/panelMap";
import { ensureOrderInfra } from "@/lib/orderNumber";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handlers = collectionHandlers("categories");
export const POST = handlers.POST;

/**
 * Categories, enriched with what each one is actually WORTH.
 * ---------------------------------------------------------------------------
 * The stored `product_count` is a hand-typed default; the live figures below are
 * derived every request from the products and orders tables, so the page can
 * never show a stale number.
 *
 * Sales figures are gated separately: a Content Editor may manage categories and
 * products but must NOT see revenue, so `sales` is only attached when the caller
 * can access `orders`.
 */
const n = (v: unknown) => Number(v ?? 0) || 0;

interface Stats {
  products: number;
  activeProducts: number;
  outOfStock: number;
  inventory: number;
  minPrice: number | null;
  maxPrice: number | null;
  unitsSold?: number;
  revenue?: number;
  orders?: number;
}

/** The few product facts the category card shows: SKU chips and a real thumbnail. */
interface CategoryProduct {
  id: string;
  name: string;
  sku: string | null;
  image: string | null;
  active: boolean;
  inStock: boolean;
}

/** Products carry `images` as a JSON array; take the first usable entry. */
function firstImage(raw: unknown): string | null {
  if (!raw) return null;
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return raw.trim() || null; // a bare URL rather than JSON
    }
  }
  if (Array.isArray(arr)) {
    const hit = arr.find((v) => typeof v === "string" && v.trim());
    return hit ? String(hit).trim() : null;
  }
  return null;
}

/**
 * Same ordering the products page uses: numeric SKU ascending, blanks last.
 * The card reads as a catalogue, so the SKU chips must match that sequence.
 */
function bySku(a: CategoryProduct, b: CategoryProduct) {
  const na = a.sku ? Number(a.sku.replace(/\D/g, "")) : NaN;
  const nb = b.sku ? Number(b.sku.replace(/\D/g, "")) : NaN;
  const va = Number.isFinite(na) ? na : Infinity;
  const vb = Number.isFinite(nb) ? nb : Infinity;
  if (va !== vb) return va - vb;
  return a.name.localeCompare(b.name);
}

export async function GET(req: Request) {
  const denied = await requireAccess("categories");
  if (denied) return denied;

  const pool = getPanelPool();
  const session = await getSession();
  const showSales = canAccess(session?.role, "orders");

  let categories: Record<string, unknown>[] = [];
  try {
    await ensureOrderInfra(); // adds categories.active / sort_order on old installs
  } catch {
    /* degrades on its own */
  }
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM `categories` ORDER BY COALESCE(sort_order, 9999) ASC, name ASC"
    );
    categories = rows.map((r) => rowToApi(MODELS.categories, r));
  } catch (err) {
    console.error("[panel categories] read failed:", err);
    return handlers.GET(req); // fall back to the plain list rather than erroring
  }

  const stats = new Map<string, Stats>();
  for (const c of categories) {
    stats.set(String(c.slug), {
      products: 0, activeProducts: 0, outOfStock: 0, inventory: 0, minPrice: null, maxPrice: null,
      ...(showSales ? { unitsSold: 0, revenue: 0, orders: 0 } : {}),
    });
  }

  /* ---------------------------- product side ---------------------------- */
  const slugById = new Map<string, string>();
  const productsBySlug = new Map<string, CategoryProduct[]>();
  if (canAccess(session?.role, "products")) {
    try {
      const [prods] = await pool.query<RowDataPacket[]>(
        "SELECT id, slug, name, category, stock, sale_price, price, active, in_stock, sku, images FROM `products`"
      );
      for (const p of prods) {
        const slug = String(p.category ?? "");
        slugById.set(String(p.id), slug);
        slugById.set(String(p.slug), slug);
        const s = stats.get(slug);
        if (!s) continue;
        const list = productsBySlug.get(slug) ?? [];
        list.push({
          id: String(p.id),
          name: String(p.name ?? ""),
          sku: p.sku ? String(p.sku) : null,
          image: firstImage(p.images),
          active: Number(p.active) !== 0,
          inStock: Number(p.in_stock) !== 0 && n(p.stock) > 0,
        });
        productsBySlug.set(slug, list);
        s.products++;
        if (Number(p.active) !== 0) s.activeProducts++;
        const stock = n(p.stock);
        s.inventory += stock;
        if (stock <= 0 || Number(p.in_stock) === 0) s.outOfStock++;
        const price = n(p.sale_price) || n(p.price);
        if (price > 0) {
          s.minPrice = s.minPrice === null ? price : Math.min(s.minPrice, price);
          s.maxPrice = s.maxPrice === null ? price : Math.max(s.maxPrice, price);
        }
      }
    } catch {
      /* products table may be missing on a fresh install */
    }
  }

  /* ----------------------------- sales side ----------------------------- */
  if (showSales) {
    try {
      const [orders] = await pool.query<RowDataPacket[]>(
        "SELECT items, status FROM `orders` WHERE status <> 'cancelled'"
      );
      for (const o of orders) {
        let items: Record<string, unknown>[] = [];
        try {
          const parsed = o.items ? JSON.parse(String(o.items)) : [];
          if (Array.isArray(parsed)) items = parsed;
        } catch {
          continue;
        }
        // One order can span categories; count it once per category it touches.
        const touched = new Set<string>();
        for (const it of items) {
          const slug = slugById.get(String(it.productId ?? "")) ?? slugById.get(String(it.slug ?? ""));
          if (!slug) continue;
          const s = stats.get(slug);
          if (!s || s.revenue === undefined) continue;
          const qty = n(it.quantity);
          s.unitsSold = (s.unitsSold ?? 0) + qty;
          s.revenue += n(it.lineTotal) || n(it.price) * qty;
          touched.add(slug);
        }
        for (const slug of touched) {
          const s = stats.get(slug);
          if (s && s.orders !== undefined) s.orders++;
        }
      }
    } catch {
      /* orders table may be missing */
    }
  }

  return NextResponse.json({
    success: true,
    items: categories.map((c) => ({
      ...c,
      // Live count wins over the stored default so the page is never stale.
      liveProductCount: stats.get(String(c.slug))?.products ?? 0,
      stats: stats.get(String(c.slug)) ?? null,
      // Ordered by SKU so the chips read in the same sequence as the products page.
      products: (productsBySlug.get(String(c.slug)) ?? []).sort(bySku),
    })),
    total: categories.length,
    showSales,
  });
}
