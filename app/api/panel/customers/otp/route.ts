import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { getSession } from "@/lib/panelAuth";

export const dynamic = "force-dynamic";

/**
 * OTP attempts, grouped by mobile number — the numbers that only ever asked for
 * a code. `otp_codes` holds one row per send, so this rolls them up per phone
 * (kis number ne kab, kitni baar OTP mangwaya) and joins whatever came after:
 * an account, and orders.
 *
 * NOTE on `consumed`: it does NOT mean "verified". issueOtp() marks older live
 * codes consumed when a new one goes out, so a consumed row may simply have
 * been superseded. The honest "did they actually get in" signal is a customers
 * row + a `login` event in customer_activity, so both are joined in here and
 * the stage is derived from those, never from `consumed`.
 */
export async function GET(req: Request) {
  const denied = await requireAccess("customers");
  if (denied) return denied;
  const session = await getSession();
  const showOtpCodes = session?.role === "admin";

  const pool = getPanelPool();
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  // Floored as well as clamped — it is interpolated into the SQL, and a
  // fractional `LIMIT 50.5` is a syntax error that this route would otherwise
  // swallow into an empty (but "successful") list.
  const limitParam = Math.floor(Number(url.searchParams.get("limit") ?? 500));
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 2000) : 500;

  const params: unknown[] = [];
  let where = "";
  if (q) {
    where = "WHERE o.phone LIKE ? ";
    params.push(`%${q.replace(/\D/g, "") || q}%`);
  }

  let rows: RowDataPacket[] = [];
  try {
    const [result] = await pool.query<RowDataPacket[]>(
      "SELECT o.phone, " +
        "COUNT(*) AS attempts, " +
        "MIN(o.created_at) AS first_at, " +
        "MAX(o.created_at) AS last_at, " +
        "SUBSTRING_INDEX(GROUP_CONCAT(o.code ORDER BY o.id DESC), ',', 1) AS last_code, " +
        "SUBSTRING_INDEX(GROUP_CONCAT(o.channel ORDER BY o.id DESC), ',', 1) AS last_channel, " +
        "SUBSTRING_INDEX(GROUP_CONCAT(COALESCE(o.ip,'') ORDER BY o.id DESC), ',', 1) AS last_ip, " +
        "GROUP_CONCAT(DISTINCT COALESCE(o.purpose,'login')) AS purposes, " +
        "c.phone AS cust_phone, c.name, c.email, c.verified, " +
        "c.created_at AS cust_created_at, c.last_login_at, " +
        "(SELECT COUNT(*) FROM `orders` od WHERE od.customer_mobile = o.phone) AS orders_count, " +
        "(SELECT COALESCE(SUM(od.total),0) FROM `orders` od WHERE od.customer_mobile = o.phone AND od.status <> 'cancelled') AS total_spent " +
        "FROM `otp_codes` o " +
        "LEFT JOIN `customers` c ON c.phone = o.phone " +
        where +
        "GROUP BY o.phone, c.phone, c.name, c.email, c.verified, c.created_at, c.last_login_at " +
        `ORDER BY last_at DESC LIMIT ${limit}`,
      params
    );
    rows = result;
  } catch {
    // Table not created yet (fresh install, before the first OTP) — an empty
    // list is the right answer, not a 500.
    return NextResponse.json({ success: true, leads: [], activityAvailable: false });
  }

  // Real "they verified and got in" signal. Separate query so a missing
  // customer_activity table degrades to "unknown" instead of failing the page.
  const logins = new Map<string, number>();
  let activityAvailable = true;
  try {
    const [acts] = await pool.query<RowDataPacket[]>(
      "SELECT phone, COUNT(*) AS n FROM `customer_activity` WHERE action = 'login' GROUP BY phone"
    );
    for (const a of acts) logins.set(String(a.phone), Number(a.n ?? 0));
  } catch {
    activityAvailable = false;
  }

  const leads = rows.map((r) => {
    const phone = String(r.phone);
    const ordersCount = Number(r.orders_count ?? 0);
    const isCustomer = Boolean(r.cust_phone);
    const loginCount = logins.get(phone) ?? 0;
    return {
      phone,
      attempts: Number(r.attempts ?? 0),
      firstAt: r.first_at ?? null,
      lastAt: r.last_at ?? null,
      // Admin-only: a live code is a working key to that customer's account,
      // and `customers` access extends to the manager role. The page never
      // displays it today, but it must not be sitting in the response either.
      lastCode: showOtpCodes && r.last_code ? String(r.last_code) : null,
      lastChannel: r.last_channel ? String(r.last_channel) : "",
      lastIp: r.last_ip ? String(r.last_ip) : null,
      purposes: r.purposes ? String(r.purposes) : "",
      isCustomer,
      name: r.name ?? null,
      email: r.email ?? null,
      verified: Boolean(Number(r.verified ?? 0)),
      customerSince: r.cust_created_at ?? null,
      lastLoginAt: r.last_login_at ?? null,
      loginCount,
      ordersCount,
      totalSpent: Number(r.total_spent ?? 0),
      /** otp_only = code maanga, account bana hi nahi. */
      stage: !isCustomer ? "otp_only" : ordersCount > 0 ? "ordered" : "no_order",
    };
  });

  return NextResponse.json({ success: true, leads, activityAvailable });
}
