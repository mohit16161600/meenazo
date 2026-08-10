import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getCustomerSession } from "@/lib/customerAuth";
import { getPanelPool } from "@/lib/panelDb";
import { logCustomerActivity } from "@/lib/customerActivity";
import { clientIp } from "@/lib/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function phoneOr401(): Promise<string | NextResponse> {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Please log in." }, { status: 401 });
  }
  return session.phone;
}

/** List the customer's wishlist (timestamped). */
export async function GET() {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT product_id, product_slug, product_name, created_at FROM `wishlist_items` WHERE phone = ? ORDER BY created_at DESC",
    [phone]
  );
  const items = rows.map((r) => ({
    productId: String(r.product_id),
    slug: r.product_slug ? String(r.product_slug) : undefined,
    name: r.product_name ? String(r.product_name) : undefined,
    createdAt: r.created_at ?? null,
  }));
  return NextResponse.json({ success: true, items, ids: items.map((i) => i.productId) });
}

/** Add one product to the wishlist (idempotent). */
export async function POST(req: Request) {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const body = await req.json().catch(() => null);
  const productId = String(body?.productId ?? "").trim();
  if (!productId) return NextResponse.json({ success: false, message: "productId required" }, { status: 422 });

  const pool = getPanelPool();
  const [exists] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM `wishlist_items` WHERE phone = ? AND product_id = ? LIMIT 1",
    [phone, productId]
  );
  if (!exists.length) {
    await pool.query(
      "INSERT INTO `wishlist_items` (id, phone, product_id, product_slug, product_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [
        `wis-${randomUUID().slice(0, 12)}`,
        phone,
        productId,
        body?.slug ? String(body.slug) : null,
        body?.name ? String(body.name) : null,
        new Date().toISOString(),
      ]
    );
    await logCustomerActivity(
      phone,
      "wishlist_add",
      { productId, name: body?.name ? String(body.name) : null },
      clientIp(req)
    );
  }
  return NextResponse.json({ success: true });
}

/** Remove one product from the wishlist. */
export async function DELETE(req: Request) {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const url = new URL(req.url);
  const body = await req.json().catch(() => null);
  const productId = String(body?.productId ?? url.searchParams.get("productId") ?? "").trim();
  if (!productId) return NextResponse.json({ success: false, message: "productId required" }, { status: 422 });
  const pool = getPanelPool();
  const [res] = await pool.query(
    "DELETE FROM `wishlist_items` WHERE phone = ? AND product_id = ?",
    [phone, productId]
  );
  if ((res as { affectedRows?: number }).affectedRows) {
    await logCustomerActivity(phone, "wishlist_remove", { productId }, clientIp(req));
  }
  return NextResponse.json({ success: true });
}

/** Bulk-merge local wishlist into the server (called right after login). */
export async function PUT(req: Request) {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const body = await req.json().catch(() => null);
  const items: { productId?: string; slug?: string; name?: string }[] = Array.isArray(body?.items) ? body.items : [];
  const pool = getPanelPool();
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT product_id FROM `wishlist_items` WHERE phone = ?",
    [phone]
  );
  const have = new Set(existing.map((r) => String(r.product_id)));
  const stamp = new Date().toISOString();
  const merged: string[] = [];
  for (const it of items) {
    const productId = String(it?.productId ?? "").trim();
    if (!productId || have.has(productId)) continue;
    have.add(productId);
    await pool.query(
      "INSERT INTO `wishlist_items` (id, phone, product_id, product_slug, product_name, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [`wis-${randomUUID().slice(0, 12)}`, phone, productId, it?.slug ?? null, it?.name ?? null, stamp]
    );
    merged.push(it?.name ? String(it.name) : productId);
  }
  if (merged.length) {
    await logCustomerActivity(phone, "wishlist_add", { merged, count: merged.length }, clientIp(req));
  }
  return NextResponse.json({ success: true, count: have.size });
}
