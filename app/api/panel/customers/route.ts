import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireAccess } from "@/lib/panelCrud";
import { getPanelPool } from "@/lib/panelDb";
import { normalizePhone } from "@/lib/phone";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseJson<T>(raw: unknown, fallback: T): T {
  try {
    return raw ? (JSON.parse(String(raw)) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Panel customers endpoint.
 *  - GET ?phone=<number>  → full A-to-Z profile for one customer (keyed by
 *    number): profile, all orders, wishlist (timestamped), live/abandoned cart,
 *    and the OTP log.
 *  - GET (optionally ?q=)  → recent customers list with order counts + spend.
 */
export async function GET(req: Request) {
  const denied = await requireAccess("customers");
  if (denied) return denied;

  const pool = getPanelPool();
  const url = new URL(req.url);
  const phoneParam = url.searchParams.get("phone");

  // -------- single customer 360 --------
  if (phoneParam) {
    const phone = normalizePhone(phoneParam) ?? phoneParam.replace(/\D/g, "");

    const [custRows] = await pool.query<RowDataPacket[]>(
      "SELECT phone, name, email, password, verified, last_login_at, ip, created_at, updated_at FROM `customers` WHERE phone = ? LIMIT 1",
      [phone]
    );
    const [orderRows] = await pool.query<RowDataPacket[]>(
      "SELECT id, order_number, items, subtotal, discount, shipping, total, coupon_code, payment_method, status, address, city, state, pincode, created_at FROM `orders` WHERE customer_mobile = ? ORDER BY created_at DESC",
      [phone]
    );
    const [wishRows] = await pool.query<RowDataPacket[]>(
      "SELECT product_id, product_slug, product_name, created_at FROM `wishlist_items` WHERE phone = ? ORDER BY created_at DESC",
      [phone]
    );
    const [cartRows] = await pool.query<RowDataPacket[]>(
      "SELECT items, item_count, subtotal, coupon_code, status, last_activity_at, updated_at FROM `carts` WHERE phone = ? LIMIT 1",
      [phone]
    );
    const [otpRows] = await pool.query<RowDataPacket[]>(
      "SELECT code, channel, purpose, consumed, expires_at, created_at FROM `otp_codes` WHERE phone = ? ORDER BY id DESC LIMIT 25",
      [phone]
    );
    // Full activity trail — login/register/OTP/wishlist/cart/order/profile,
    // newest first. The table may not exist until the first event on a fresh
    // install, so a missing table just reads as "no activity yet".
    let activityRows: RowDataPacket[] = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, action, details, ip, created_at FROM `customer_activity` WHERE phone = ? ORDER BY id DESC LIMIT 100",
        [phone]
      );
      activityRows = rows;
    } catch {
      /* table not created yet */
    }

    const c = custRows[0];
    const cart = cartRows[0]
      ? {
          items: parseJson<unknown[]>(cartRows[0].items, []),
          itemCount: Number(cartRows[0].item_count ?? 0),
          subtotal: Number(cartRows[0].subtotal ?? 0),
          couponCode: cartRows[0].coupon_code ?? null,
          status: String(cartRows[0].status ?? "active"),
          lastActivityAt: cartRows[0].last_activity_at ?? null,
          updatedAt: cartRows[0].updated_at ?? null,
        }
      : null;

    const orders = orderRows.map((o) => ({
      id: String(o.id),
      orderNumber: String(o.order_number),
      items: parseJson<unknown[]>(o.items, []),
      subtotal: Number(o.subtotal ?? 0),
      discount: Number(o.discount ?? 0),
      shipping: Number(o.shipping ?? 0),
      total: Number(o.total ?? 0),
      couponCode: o.coupon_code ?? null,
      paymentMethod: String(o.payment_method ?? ""),
      status: String(o.status ?? ""),
      address: o.address ?? null,
      city: o.city ?? null,
      state: o.state ?? null,
      pincode: o.pincode ?? null,
      createdAt: o.created_at ?? null,
    }));

    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);

    return NextResponse.json({
      success: true,
      found: custRows.length > 0 || orders.length > 0,
      phone,
      customer: c
        ? {
            phone: String(c.phone),
            name: c.name ?? null,
            email: c.email ?? null,
            password: c.password ?? null, // owner-visible (like admin users)
            verified: Boolean(Number(c.verified)),
            lastLoginAt: c.last_login_at ?? null,
            ip: c.ip ?? null,
            createdAt: c.created_at ?? null,
          }
        : null,
      stats: { ordersCount: orders.length, totalSpent, wishlistCount: wishRows.length },
      orders,
      wishlist: wishRows.map((w) => ({
        productId: String(w.product_id),
        slug: w.product_slug ?? null,
        name: w.product_name ?? null,
        createdAt: w.created_at ?? null,
      })),
      cart,
      abandoned: cart?.status === "active" && cart.itemCount > 0 ? cart : null,
      otps: otpRows.map((o) => ({
        code: String(o.code),
        channel: String(o.channel ?? ""),
        purpose: o.purpose ?? null,
        consumed: Boolean(Number(o.consumed)),
        expiresAt: o.expires_at ?? null,
        createdAt: o.created_at ?? null,
      })),
      activity: activityRows.map((a) => ({
        id: Number(a.id),
        action: String(a.action ?? ""),
        details: parseJson<Record<string, unknown> | null>(a.details, null),
        ip: a.ip ?? null,
        createdAt: a.created_at ?? null,
      })),
    });
  }

  // -------- recent customers list --------
  const q = url.searchParams.get("q")?.trim();
  const params: unknown[] = [];
  let where = "";
  if (q) {
    where = "WHERE c.phone LIKE ? OR c.name LIKE ? OR c.email LIKE ? ";
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT c.phone, c.name, c.email, c.verified, c.last_login_at, c.created_at, " +
      "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = c.phone) AS orders_count, " +
      "(SELECT COALESCE(SUM(total),0) FROM `orders` o WHERE o.customer_mobile = c.phone AND o.status <> 'cancelled') AS total_spent " +
      `FROM \`customers\` c ${where}ORDER BY c.updated_at DESC LIMIT 100`,
    params
  );

  // Site-wide recent activity feed — answers "kaun kab login hua / kya kiya"
  // without opening each customer. Names joined in for readability.
  let recentActivity: RowDataPacket[] = [];
  try {
    const [acts] = await pool.query<RowDataPacket[]>(
      "SELECT a.id, a.phone, a.action, a.details, a.created_at, c.name " +
        "FROM `customer_activity` a LEFT JOIN `customers` c ON c.phone = a.phone " +
        "ORDER BY a.id DESC LIMIT 40"
    );
    recentActivity = acts;
  } catch {
    /* table not created yet */
  }

  return NextResponse.json({
    success: true,
    customers: rows.map((c) => ({
      phone: String(c.phone),
      name: c.name ?? null,
      email: c.email ?? null,
      verified: Boolean(Number(c.verified)),
      ordersCount: Number(c.orders_count ?? 0),
      totalSpent: Number(c.total_spent ?? 0),
      lastLoginAt: c.last_login_at ?? null,
      createdAt: c.created_at ?? null,
    })),
    recentActivity: recentActivity.map((a) => ({
      id: Number(a.id),
      phone: String(a.phone),
      name: a.name ?? null,
      action: String(a.action ?? ""),
      details: parseJson<Record<string, unknown> | null>(a.details, null),
      createdAt: a.created_at ?? null,
    })),
  });
}
