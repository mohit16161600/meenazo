import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { requireAccess } from "@/lib/panelCrud";
import { getSession } from "@/lib/panelAuth";
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

  // `customers` access is held by the manager role too, and an OTP code is a
  // live credential rather than a record — so the digits are admin-only.
  const session = await getSession();
  const showOtpCodes = session?.role === "admin";

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
    // Every cart/checkout this number walked away from. Same "may not exist
    // yet" treatment as the activity trail below — the table is created on the
    // first sweep, not at install.
    let abandonedRows: RowDataPacket[] = [];
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, stage, item_count, value, items, coupon_code, order_number, payment_method, " +
          "abandoned_at, last_activity_at, recovered, recovered_at, recovered_order_number " +
          "FROM `abandoned_carts` WHERE phone = ? ORDER BY id DESC LIMIT 50",
        [phone]
      );
      abandonedRows = rows;
    } catch {
      /* table not created yet */
    }

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
      stats: {
        ordersCount: orders.length,
        totalSpent,
        wishlistCount: wishRows.length,
        // Counted from the same rows the page lists, so the tile and the list
        // can never disagree.
        deliveredCount: orders.filter((o) => o.status === "delivered").length,
        cancelledCount: orders.filter((o) => o.status === "cancelled").length,
        abandonedCount: abandonedRows.filter((a) => !Number(a.recovered)).length,
        abandonedValue: abandonedRows
          .filter((a) => !Number(a.recovered))
          .reduce((s, a) => s + Number(a.value ?? 0), 0),
        recoveredCount: abandonedRows.filter((a) => Number(a.recovered)).length,
        firstOrderAt: orders.length ? orders[orders.length - 1].createdAt : null,
        lastOrderAt: orders.length ? orders[0].createdAt : null,
        aov: orders.length
          ? Math.round(totalSpent / Math.max(1, orders.filter((o) => o.status !== "cancelled").length))
          : 0,
      },
      abandonedCarts: abandonedRows.map((a) => ({
        id: Number(a.id),
        stage: String(a.stage ?? ""),
        itemCount: Number(a.item_count ?? 0),
        value: Number(a.value ?? 0),
        items: parseJson<unknown[]>(a.items, []),
        couponCode: a.coupon_code ?? null,
        orderNumber: a.order_number ?? null,
        paymentMethod: a.payment_method ?? null,
        abandonedAt: a.abandoned_at ?? null,
        lastActivityAt: a.last_activity_at ?? null,
        recovered: Boolean(Number(a.recovered)),
        recoveredAt: a.recovered_at ?? null,
        recoveredOrderNumber: a.recovered_order_number ?? null,
      })),
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
        // A LIVE code is a working key to that customer's account: anyone who
        // can see it can trigger an OTP on their number and walk straight in.
        // Admins keep the audit view; every other role sees that a code was
        // sent, when, and on which channel — never the digits.
        code: showOtpCodes ? String(o.code) : "••••••",
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
  /**
   * The list is a WORKING view, not a directory: "who is this, what have they
   * bought, where do they live, and is there anything of theirs sitting in a
   * cart right now" — all answerable without opening a single profile.
   *
   * Everything is derived with correlated subqueries rather than denormalised
   * onto `customers`. A stored counter is a counter that goes wrong the first
   * time an order is cancelled by hand; this can't drift because it is computed
   * from the rows themselves. Capped at 100 customers, so the cost is bounded.
   */
  const enriched =
    "SELECT c.phone, c.name, c.email, c.verified, c.last_login_at, c.created_at, c.ip, " +
    "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = c.phone) AS orders_count, " +
    "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = c.phone AND o.status = 'delivered') AS delivered_count, " +
    "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = c.phone AND o.status = 'cancelled') AS cancelled_count, " +
    "(SELECT COALESCE(SUM(total),0) FROM `orders` o WHERE o.customer_mobile = c.phone AND o.status <> 'cancelled') AS total_spent, " +
    "(SELECT o.created_at FROM `orders` o WHERE o.customer_mobile = c.phone ORDER BY o.id DESC LIMIT 1) AS last_order_at, " +
    "(SELECT o.order_number FROM `orders` o WHERE o.customer_mobile = c.phone ORDER BY o.id DESC LIMIT 1) AS last_order_number, " +
    "(SELECT o.status FROM `orders` o WHERE o.customer_mobile = c.phone ORDER BY o.id DESC LIMIT 1) AS last_order_status, " +
    "(SELECT o.city FROM `orders` o WHERE o.customer_mobile = c.phone AND o.city IS NOT NULL ORDER BY o.id DESC LIMIT 1) AS city, " +
    "(SELECT o.state FROM `orders` o WHERE o.customer_mobile = c.phone AND o.state IS NOT NULL ORDER BY o.id DESC LIMIT 1) AS state, " +
    "(SELECT COUNT(*) FROM `wishlist_items` w WHERE w.phone = c.phone) AS wishlist_count, " +
    "(SELECT ct.item_count FROM `carts` ct WHERE ct.phone = c.phone LIMIT 1) AS cart_items, " +
    "(SELECT ct.subtotal FROM `carts` ct WHERE ct.phone = c.phone LIMIT 1) AS cart_value, " +
    "(SELECT ct.status FROM `carts` ct WHERE ct.phone = c.phone LIMIT 1) AS cart_status, " +
    "(SELECT COUNT(*) FROM `abandoned_carts` ab WHERE ab.phone = c.phone AND ab.recovered = 0) AS abandoned_count, " +
    "(SELECT COALESCE(SUM(ab.value),0) FROM `abandoned_carts` ab WHERE ab.phone = c.phone AND ab.recovered = 0) AS abandoned_value " +
    `FROM \`customers\` c ${where}ORDER BY c.updated_at DESC LIMIT 100`;

  /** The pre-enrichment query — the fallback when an optional table is absent. */
  const basic =
    "SELECT c.phone, c.name, c.email, c.verified, c.last_login_at, c.created_at, " +
    "(SELECT COUNT(*) FROM `orders` o WHERE o.customer_mobile = c.phone) AS orders_count, " +
    "(SELECT COALESCE(SUM(total),0) FROM `orders` o WHERE o.customer_mobile = c.phone AND o.status <> 'cancelled') AS total_spent " +
    `FROM \`customers\` c ${where}ORDER BY c.updated_at DESC LIMIT 100`;

  let rows: RowDataPacket[];
  try {
    [rows] = await pool.query<RowDataPacket[]>(enriched, params);
  } catch (err) {
    // `wishlist_items` / `carts` only exist once the customer features have been
    // used. A fresh install must still get its customer list, just thinner.
    console.error("[panel/customers] enriched list failed, falling back:", (err as Error)?.message);
    [rows] = await pool.query<RowDataPacket[]>(basic, params);
  }

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
      // Enrichment — absent (undefined → null) when the fallback query ran.
      deliveredCount: c.delivered_count === undefined ? null : Number(c.delivered_count ?? 0),
      cancelledCount: c.cancelled_count === undefined ? null : Number(c.cancelled_count ?? 0),
      lastOrderAt: c.last_order_at ?? null,
      lastOrderNumber: c.last_order_number ?? null,
      lastOrderStatus: c.last_order_status ?? null,
      city: c.city ?? null,
      state: c.state ?? null,
      wishlistCount: c.wishlist_count === undefined ? null : Number(c.wishlist_count ?? 0),
      cartItems: c.cart_items === undefined ? null : Number(c.cart_items ?? 0),
      cartValue: c.cart_value === undefined ? null : Number(c.cart_value ?? 0),
      cartStatus: c.cart_status ?? null,
      abandonedCount: c.abandoned_count === undefined ? null : Number(c.abandoned_count ?? 0),
      abandonedValue: c.abandoned_value === undefined ? null : Number(c.abandoned_value ?? 0),
      ip: c.ip ?? null,
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
