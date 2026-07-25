import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getCustomerSession } from "@/lib/customerAuth";
import { getPanelPool } from "@/lib/panelDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function phoneOr401(): Promise<string | NextResponse> {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ success: false, message: "Please log in." }, { status: 401 });
  return session.phone;
}

/** Read the customer's saved cart. */
export async function GET() {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM `carts` WHERE phone = ? LIMIT 1", [phone]);
  const row = rows[0];
  if (!row) return NextResponse.json({ success: true, cart: null });
  let items: unknown = [];
  try {
    items = row.items ? JSON.parse(String(row.items)) : [];
  } catch {
    items = [];
  }
  return NextResponse.json({
    success: true,
    cart: {
      items,
      itemCount: Number(row.item_count ?? 0),
      subtotal: Number(row.subtotal ?? 0),
      couponCode: row.coupon_code ?? null,
      status: row.status ?? "active",
      updatedAt: row.updated_at ?? null,
    },
  });
}

/**
 * Save/replace the customer's live cart (status active). Called (debounced) as
 * the cart changes and when entering checkout, so an un-ordered cart with items
 * becomes a visible "abandoned" cart in the panel.
 */
export async function PUT(req: Request) {
  const phone = await phoneOr401();
  if (phone instanceof NextResponse) return phone;
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  const itemCount = items.reduce((n: number, i: { quantity?: number }) => n + Number(i?.quantity ?? 0), 0);
  const subtotal = Math.round(Number(body?.subtotal ?? 0)) || 0;
  const couponCode = body?.couponCode ? String(body.couponCode) : null;
  const now = new Date().toISOString();

  const pool = getPanelPool();
  await pool.query(
    "INSERT INTO `carts` (phone, items, item_count, subtotal, coupon_code, status, last_activity_at, created_at, updated_at) " +
      "VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE items = VALUES(items), item_count = VALUES(item_count), subtotal = VALUES(subtotal), " +
      "coupon_code = VALUES(coupon_code), status = 'active', last_activity_at = VALUES(last_activity_at), updated_at = VALUES(updated_at)",
    [phone, JSON.stringify(items), itemCount, subtotal, couponCode, now, now, now]
  );
  return NextResponse.json({ success: true });
}
