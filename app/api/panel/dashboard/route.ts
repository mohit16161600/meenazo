import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { getSession } from "@/lib/panelAuth";
import { MODELS, ORDER_STATUSES } from "@/lib/panelModels";
import { rowToApi } from "@/lib/panelMap";
import { canAccess } from "@/lib/panelRoles";
import { istDayKey } from "@/lib/panelDateRange";
import { ensureOrderInfra } from "@/lib/orderNumber";
import { paymentTypeOf, balanceDue, type PaymentType } from "@/lib/paymentType";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dashboard aggregate - the store's whole picture in one call.
 * ---------------------------------------------------------------------------
 * Every SECTION is gated by the caller's resource access: a role that gets a
 * 403 on /api/panel/orders must not receive order rows, revenue or payment data
 * through this aggregate either.
 *
 * `created_at` is an ISO string in a VARCHAR, so date maths is string maths -
 * ISO-8601 sorts lexicographically and `LEFT(created_at, 10)` is the day key.
 *
 * Money NEVER counts cancelled orders. Each headline also carries the same
 * figure for the PREVIOUS window of equal length, so the UI can show a real
 * "vs last period" delta rather than a decorative percentage.
 */

const DAY_MS = 86_400_000;
/**
 * The day a moment belongs to, in IST.
 *
 * This MUST use the same clock as the bucketing below. It used to be
 * `toISOString().slice(0, 10)` (a UTC day) on both sides — consistent, but
 * wrong by 5½ hours; switching only one side would have been worse still,
 * silently zeroing every bar on the trend chart.
 */
const isoDay = (d: Date) => istDayKey(d);
const n = (v: unknown) => Number(v ?? 0) || 0;

interface Window {
  sales: number;
  collected: number;
  due: number;
  orders: number;
  cancelled: number;
}
const emptyWindow = (): Window => ({ sales: 0, collected: 0, due: 0, orders: 0, cancelled: 0 });

export async function GET(req: Request) {
  const denied = await requireAccess("dashboard");
  if (denied) return denied;
  const session = await getSession();
  const role = session?.role;

  const url = new URL(req.url);
  const daysParam = Number(url.searchParams.get("days") ?? 30);
  const days = [7, 30, 90, 365].includes(daysParam) ? daysParam : 30;

  const pool = getPanelPool();
  const now = new Date();
  const fromIso = new Date(now.getTime() - days * DAY_MS).toISOString();
  const prevFromIso = new Date(now.getTime() - 2 * days * DAY_MS).toISOString();
  const todayKey = isoDay(now);
  const yesterdayKey = isoDay(new Date(now.getTime() - DAY_MS));

  const counts: Record<string, number> = {};
  for (const model of Object.values(MODELS)) {
    if (!canAccess(role, model.name)) continue;
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM \`${model.table}\``);
      counts[model.name] = n(rows[0]?.n);
    } catch {
      counts[model.name] = 0;
    }
  }

  const canOrders = canAccess(role, "orders");
  const canCustomers = canAccess(role, "customers");
  const canProducts = canAccess(role, "products");

  /* ------------------------------ orders ------------------------------- */
  const allTime = { sales: 0, prepaid: 0, cod: 0, collected: 0, due: 0, orders: 0 };
  const current = emptyWindow();
  const previous = emptyWindow();
  const today = emptyWindow();
  const yesterday = emptyWindow();
  const statusNow: Record<string, number> = {};
  const statusPrev: Record<string, number> = {};
  const payAgg = new Map<PaymentType, { orders: number; revenue: number; collected: number; due: number }>();
  const dayAgg = new Map<string, { revenue: number; orders: number }>();
  const productAgg = new Map<string, { units: number; revenue: number }>();
  const stateAgg = new Map<string, number>();
  let recentOrders: Record<string, unknown>[] = [];
  const fulfillment = { pushed: 0, queued: 0, failing: 0 };
  let repeatCustomers = 0;

  if (canOrders) {
    try {
      await ensureOrderInfra(); // amount_paid may be missing on an old install
    } catch {
      /* the queries below degrade on their own */
    }

    try {
      // ALL orders, once. Payment type and per-product totals need row-level
      // logic (JSON items, paid-vs-total) that SQL would only duplicate, and
      // the catalogue is small enough that one pass is cheaper than six queries.
      const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM `orders` ORDER BY created_at DESC");
      const orders = rows.map((r) => rowToApi(MODELS.orders, r));
      recentOrders = orders.slice(0, 8);

      for (const o of orders) {
        const createdAt = String(o.createdAt ?? "");
        // Indian day, not UTC — same reason as analytics (lib/panelDateRange.ts).
        const day = istDayKey(createdAt);
        const status = String(o.status ?? "pending").toLowerCase();
        const cancelled = status === "cancelled";
        const total = n(o.total);
        const due = balanceDue(o);
        const paid = total - due;

        // Status counts are the one figure that DOES include cancelled orders -
        // "how many were cancelled" is exactly what that tile reports.
        if (createdAt >= fromIso) statusNow[status] = (statusNow[status] ?? 0) + 1;
        else if (createdAt >= prevFromIso) statusPrev[status] = (statusPrev[status] ?? 0) + 1;

        const bucket = (w: Window) => {
          if (cancelled) {
            w.cancelled++;
            return;
          }
          w.sales += total;
          w.collected += paid;
          w.due += due;
          w.orders++;
        };
        if (createdAt >= fromIso) bucket(current);
        else if (createdAt >= prevFromIso) bucket(previous);
        if (day === todayKey) bucket(today);
        if (day === yesterdayKey) bucket(yesterday);

        if (cancelled) continue;

        allTime.sales += total;
        allTime.collected += paid;
        allTime.due += due;
        allTime.orders++;
        const type = paymentTypeOf(o);
        if (type === "prepaid") allTime.prepaid += total;
        else allTime.cod += total;

        if (createdAt >= fromIso) {
          const p = payAgg.get(type) ?? { orders: 0, revenue: 0, collected: 0, due: 0 };
          p.orders++;
          p.revenue += total;
          p.collected += paid;
          p.due += due;
          payAgg.set(type, p);

          const d = dayAgg.get(day) ?? { revenue: 0, orders: 0 };
          d.revenue += total;
          d.orders++;
          dayAgg.set(day, d);

          const st = String(o.state ?? "").trim();
          if (st) stateAgg.set(st, (stateAgg.get(st) ?? 0) + total);

          for (const it of Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : []) {
            const name = String(it.name ?? it.productId ?? "Unknown");
            const qty = n(it.quantity);
            const line = n(it.lineTotal) || n(it.price) * qty;
            const agg = productAgg.get(name) ?? { units: 0, revenue: 0 };
            agg.units += qty;
            agg.revenue += line;
            productAgg.set(name, agg);
          }
        }

        if (o.easyecomSynced) fulfillment.pushed++;
        else {
          fulfillment.queued++;
          if (o.easyecomError) fulfillment.failing++;
        }
      }

      const [rep] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM (SELECT customer_mobile FROM `orders` WHERE status <> 'cancelled' " +
          "GROUP BY customer_mobile HAVING COUNT(*) > 1) x"
      );
      repeatCustomers = n(rep[0]?.n);
    } catch (err) {
      console.error("[dashboard] order aggregates failed:", err);
    }
  }

  /* ----------------------------- customers ----------------------------- */
  const customers = { total: 0, verified: 0, unverified: 0, newInPeriod: 0, prevNew: 0, today: 0, yesterday: 0, repeat: repeatCustomers };
  const carts = { active: 0, abandoned: 0, converted: 0 };
  let wishlistItems = 0;

  if (canCustomers) {
    try {
      const [c] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) total, COALESCE(SUM(verified = 1),0) verified, COALESCE(SUM(verified = 0),0) unverified, " +
          "COALESCE(SUM(created_at >= ?),0) newInPeriod, " +
          "COALESCE(SUM(created_at >= ? AND created_at < ?),0) prevNew, " +
          "COALESCE(SUM(LEFT(created_at,10) = ?),0) todayNew, " +
          "COALESCE(SUM(LEFT(created_at,10) = ?),0) yestNew FROM `customers`",
        [fromIso, prevFromIso, fromIso, todayKey, yesterdayKey]
      );
      customers.total = n(c[0]?.total);
      customers.verified = n(c[0]?.verified);
      customers.unverified = n(c[0]?.unverified);
      customers.newInPeriod = n(c[0]?.newInPeriod);
      customers.prevNew = n(c[0]?.prevNew);
      customers.today = n(c[0]?.todayNew);
      customers.yesterday = n(c[0]?.yestNew);
    } catch {
      /* customers table may not exist on an old install */
    }
    try {
      const [ct] = await pool.query<RowDataPacket[]>("SELECT status, COUNT(*) AS n FROM `carts` GROUP BY status");
      for (const r of ct) {
        const s = String(r.status ?? "active");
        if (s === "abandoned") carts.abandoned = n(r.n);
        else if (s === "converted") carts.converted = n(r.n);
        else carts.active = n(r.n);
      }
    } catch {
      /* ignore */
    }
    try {
      const [w] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM `wishlist_items`");
      wishlistItems = n(w[0]?.n);
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------ products ----------------------------- */
  let lowStock: Record<string, unknown>[] = [];
  let outOfStock = 0;
  if (canProducts) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM `products` WHERE stock <= 10 ORDER BY stock ASC LIMIT 6"
      );
      lowStock = rows.map((r) => rowToApi(MODELS.products, r));
      const [oos] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM `products` WHERE stock <= 0");
      outOfStock = n(oos[0]?.n);
    } catch {
      /* ignore */
    }
  }

  /* ------------------------------ derived ------------------------------ */
  const trend: { date: string; revenue: number; orders: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = isoDay(new Date(now.getTime() - i * DAY_MS));
    const v = dayAgg.get(key) ?? { revenue: 0, orders: 0 };
    trend.push({ date: key, revenue: v.revenue, orders: v.orders });
  }

  const payments = (["prepaid", "partial", "cod"] as PaymentType[]).map((t) => ({
    type: t,
    ...(payAgg.get(t) ?? { orders: 0, revenue: 0, collected: 0, due: 0 }),
  }));

  const statusSummary = ORDER_STATUSES.map((s) => ({
    status: s,
    orders: statusNow[s] ?? 0,
    prev: statusPrev[s] ?? 0,
  }));

  const topProducts = [...productAgg.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const topStates = [...stateAgg.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const pctOf = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
  const insights = {
    aov: current.orders > 0 ? Math.round(current.sales / current.orders) : 0,
    prepaidRatio: pctOf(payments[0].revenue, current.sales),
    verifiedRate: pctOf(customers.verified, customers.total),
    unverifiedRate: pctOf(customers.unverified, customers.total),
    repeatRate: pctOf(repeatCustomers, customers.total),
    cancelRate: pctOf(current.cancelled, current.orders + current.cancelled),
    collectedRate: pctOf(current.collected, current.sales),
  };

  return NextResponse.json({
    success: true,
    role: role ?? "",
    days,
    generatedAt: now.toISOString(),
    counts,
    allTime,
    current,
    previous,
    today,
    yesterday,
    statusSummary,
    payments,
    trend,
    topProducts,
    topStates,
    customers,
    carts,
    wishlistItems,
    fulfillment,
    lowStock,
    outOfStock,
    insights,
    recentOrders,
    // Kept for older callers that still read these two.
    revenue: allTime.sales,
    pendingOrders: statusNow.pending ?? 0,
  });
}
