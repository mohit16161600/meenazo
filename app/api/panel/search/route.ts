import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { getSession } from "@/lib/panelAuth";
import { canAccess } from "@/lib/panelRoles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Global panel search — "find this person / this order / this product".
 * ---------------------------------------------------------------------------
 * One query box across orders, customers and products. Every group is gated by
 * the caller's own resource access, so a content role searching "9876…" gets
 * products but never a customer's phone number.
 *
 * Phone numbers are normalised (spaces, +91, dashes stripped) before matching,
 * because that is how people actually paste them.
 */

interface Hit {
  group: "orders" | "customers" | "products";
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

const digitsOnly = (s: string) => s.replace(/\D/g, "");

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }
  const role = session.role;

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ success: true, query: q, hits: [] });

  const pool = getPanelPool();
  const like = `%${q}%`;
  const digits = digitsOnly(q);
  // A 10-digit tail matches a number typed with or without +91.
  const phoneLike = digits.length >= 4 ? `%${digits.slice(-10)}%` : null;
  const hits: Hit[] = [];

  if (canAccess(role, "orders")) {
    try {
      const params: unknown[] = [like, like, like, like];
      let sql =
        "SELECT id, order_number, customer_name, customer_mobile, total, status, created_at " +
        "FROM `orders` WHERE (order_number LIKE ? OR customer_name LIKE ? OR customer_mobile LIKE ? OR city LIKE ?";
      if (phoneLike) {
        sql += " OR shipping_phone LIKE ?";
        params.push(phoneLike);
      }
      sql += ") ORDER BY created_at DESC LIMIT 8";
      const [rows] = await pool.query<RowDataPacket[]>(sql, params);
      for (const r of rows) {
        hits.push({
          group: "orders",
          id: String(r.id),
          title: String(r.order_number ?? r.id),
          subtitle: `${String(r.customer_name ?? "")} · ${String(r.customer_mobile ?? "")}`,
          meta: `₹${Number(r.total ?? 0).toLocaleString("en-IN")} · ${String(r.status ?? "")}`,
          href: `/panel/orders/${r.id}`,
        });
      }
    } catch {
      /* table may be missing on a fresh install */
    }
  }

  if (canAccess(role, "customers")) {
    try {
      const params: unknown[] = [like, like, like];
      let sql = "SELECT phone, name, email, verified FROM `customers` WHERE (phone LIKE ? OR name LIKE ? OR email LIKE ?";
      if (phoneLike) {
        sql += " OR phone LIKE ?";
        params.push(phoneLike);
      }
      sql += ") ORDER BY updated_at DESC LIMIT 6";
      const [rows] = await pool.query<RowDataPacket[]>(sql, params);
      for (const r of rows) {
        hits.push({
          group: "customers",
          id: String(r.phone),
          title: String(r.name || r.phone),
          subtitle: String(r.phone),
          meta: r.email ? String(r.email) : Number(r.verified) ? "Verified" : "Not verified",
          href: `/panel/customers?q=${encodeURIComponent(String(r.phone))}`,
        });
      }
    } catch {
      /* ignore */
    }
  }

  if (canAccess(role, "products")) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, slug, sku, stock, sale_price FROM `products` WHERE name LIKE ? OR slug LIKE ? OR sku LIKE ? LIMIT 6",
        [like, like, like]
      );
      for (const r of rows) {
        hits.push({
          group: "products",
          id: String(r.id),
          title: String(r.name),
          subtitle: r.sku ? `SKU ${String(r.sku)}` : String(r.slug),
          meta: `₹${Number(r.sale_price ?? 0).toLocaleString("en-IN")} · ${Number(r.stock ?? 0)} in stock`,
          href: `/panel/products/${r.id}`,
        });
      }
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json({ success: true, query: q, hits });
}
