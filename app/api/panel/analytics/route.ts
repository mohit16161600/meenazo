import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { MODELS } from "@/lib/panelModels";
import { rowToApi } from "@/lib/panelMap";
import { ensureOrderInfra } from "@/lib/orderNumber";
import { paymentTypeOf, balanceDue } from "@/lib/paymentType";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Analytics aggregate - the deep, month-by-month view of the business.
 * ---------------------------------------------------------------------------
 * Gated on the `orders` resource: this is entirely order + revenue data, so a
 * role that can't open Orders must not read it here either.
 *
 * Vocabulary (kept consistent across every figure on the page):
 *   total orders - every order placed, cancellations included
 *   pure orders  - what actually stands: total minus cancelled and RTO/returned
 *   delivered    - reached the customer
 *   RTO          - shipped but returned to origin
 * Money NEVER counts cancelled orders. "Pure sales" additionally drops RTO,
 * because a returned order is revenue that came back out again.
 */

const n = (v: unknown) => Number(v ?? 0) || 0;
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

interface MonthRow {
  month: string;
  totalOrders: number;
  pureOrders: number;
  cancelled: number;
  cancelledPct: number;
  delivered: number;
  deliveredPct: number;
  rto: number;
  rtoPct: number;
  pending: number;
  pendingPct: number;
  inTransit: number;
  totalSale: number;
  pureSale: number;
  prepaidAmount: number;
  prepaidPct: number;
  codAmount: number;
  codPct: number;
  collected: number;
  outstanding: number;
  deliveredPrepaid: number;
  deliveredCod: number;
  rtoPrepaid: number;
  rtoCod: number;
  aov: number;
  customers: number;
}

const IN_TRANSIT = new Set(["shipped", "out_for_delivery", "processing", "confirmed"]);

export async function GET(req: Request) {
  const denied = await requireAccess("analytics");
  if (denied) return denied;

  const p = new URL(req.url).searchParams;
  const from = (p.get("from") ?? "").trim();
  const to = (p.get("to") ?? "").trim();

  const pool = getPanelPool();
  try {
    await ensureOrderInfra();
  } catch {
    /* degrade on its own */
  }

  const where: string[] = [];
  const params: unknown[] = [];
  if (from) {
    where.push("created_at >= ?");
    params.push(`${from}T00:00:00.000Z`);
  }
  if (to) {
    where.push("created_at <= ?");
    params.push(`${to}T23:59:59.999Z`);
  }
  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";

  let orders: Record<string, unknown>[] = [];
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM \`orders\`${whereSql} ORDER BY created_at ASC`,
      params
    );
    orders = rows.map((r) => rowToApi(MODELS.orders, r));
  } catch (err) {
    console.error("[analytics] order read failed:", err);
    return NextResponse.json({ success: false, message: "Could not read orders." }, { status: 500 });
  }

  /* --------------------------- month buckets --------------------------- */
  const months = new Map<string, MonthRow>();
  const blank = (month: string): MonthRow => ({
    month, totalOrders: 0, pureOrders: 0, cancelled: 0, cancelledPct: 0,
    delivered: 0, deliveredPct: 0, rto: 0, rtoPct: 0, pending: 0, pendingPct: 0,
    inTransit: 0, totalSale: 0, pureSale: 0, prepaidAmount: 0, prepaidPct: 0,
    codAmount: 0, codPct: 0, collected: 0, outstanding: 0,
    deliveredPrepaid: 0, deliveredCod: 0, rtoPrepaid: 0, rtoCod: 0, aov: 0, customers: 0,
  });

  const daily = new Map<string, { orders: number; sales: number }>();
  const statusDaily = new Map<string, Record<string, number>>();
  const products = new Map<string, { name: string; totalOrders: number; pureOrders: number; revenue: number; pureSales: number; quantity: number; pending: number }>();
  const buyersByMonth = new Map<string, Set<string>>();
  let paidTotal = 0;
  let codTotal = 0;

  for (const o of orders) {
    const createdAt = String(o.createdAt ?? "");
    if (!createdAt) continue;
    const month = createdAt.slice(0, 7);
    const day = createdAt.slice(0, 10);
    const status = String(o.status ?? "pending").toLowerCase();
    const total = n(o.total);
    const due = balanceDue(o);
    const paid = total - due;
    const type = paymentTypeOf(o);
    const isPrepaid = type === "prepaid";
    const cancelled = status === "cancelled";
    const rto = status === "returned";
    const delivered = status === "delivered";

    const m = months.get(month) ?? blank(month);
    m.totalOrders++;
    if (cancelled) m.cancelled++;
    if (rto) m.rto++;
    if (delivered) m.delivered++;
    if (status === "pending") m.pending++;
    if (IN_TRANSIT.has(status)) m.inTransit++;
    if (!cancelled && !rto) m.pureOrders++;

    if (!cancelled) {
      m.totalSale += total;
      m.collected += paid;
      m.outstanding += due;
      if (isPrepaid) m.prepaidAmount += total;
      else m.codAmount += total;
      if (!rto) m.pureSale += total;

      if (delivered) {
        if (isPrepaid) m.deliveredPrepaid += total;
        else m.deliveredCod += total;
      }
      if (rto) {
        if (isPrepaid) m.rtoPrepaid += total;
        else m.rtoCod += total;
      }

      if (isPrepaid) paidTotal += total;
      else codTotal += total;

      const d = daily.get(day) ?? { orders: 0, sales: 0 };
      d.orders++;
      d.sales += total;
      daily.set(day, d);

      const mobile = String(o.customerMobile ?? "").trim();
      if (mobile) {
        const set = buyersByMonth.get(month) ?? new Set<string>();
        set.add(mobile);
        buyersByMonth.set(month, set);
      }
    }
    months.set(month, m);

    const sd = statusDaily.get(day) ?? {};
    sd[status] = (sd[status] ?? 0) + 1;
    statusDaily.set(day, sd);

    for (const it of Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : []) {
      const key = String(it.productId ?? it.slug ?? it.name ?? "unknown");
      const agg = products.get(key) ?? {
        name: String(it.name ?? key), totalOrders: 0, pureOrders: 0,
        revenue: 0, pureSales: 0, quantity: 0, pending: 0,
      };
      const qty = n(it.quantity);
      const line = n(it.lineTotal) || n(it.price) * qty;
      agg.totalOrders++;
      if (!cancelled) {
        agg.revenue += line;
        agg.quantity += qty;
        if (!rto) {
          agg.pureOrders++;
          agg.pureSales += line;
        }
      }
      if (status === "pending") agg.pending++;
      products.set(key, agg);
    }
  }

  const monthRows = [...months.values()]
    .map((m) => ({
      ...m,
      cancelledPct: pct(m.cancelled, m.totalOrders),
      deliveredPct: pct(m.delivered, m.totalOrders),
      rtoPct: pct(m.rto, m.totalOrders),
      pendingPct: pct(m.pending, m.totalOrders),
      prepaidPct: pct(m.prepaidAmount, m.totalSale),
      codPct: pct(m.codAmount, m.totalSale),
      aov: m.pureOrders > 0 ? Math.round(m.pureSale / m.pureOrders) : 0,
      customers: buyersByMonth.get(m.month)?.size ?? 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const dailyRows = [...daily.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const statusRows = [...statusDaily.entries()]
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productRows = [...products.values()].sort((a, b) => b.pureSales - a.pureSales);

  // Grand totals, so the page can lead with a summary that matches the table.
  const totals = monthRows.reduce(
    (acc, m) => ({
      totalOrders: acc.totalOrders + m.totalOrders,
      pureOrders: acc.pureOrders + m.pureOrders,
      cancelled: acc.cancelled + m.cancelled,
      delivered: acc.delivered + m.delivered,
      rto: acc.rto + m.rto,
      totalSale: acc.totalSale + m.totalSale,
      pureSale: acc.pureSale + m.pureSale,
      collected: acc.collected + m.collected,
      outstanding: acc.outstanding + m.outstanding,
    }),
    { totalOrders: 0, pureOrders: 0, cancelled: 0, delivered: 0, rto: 0, totalSale: 0, pureSale: 0, collected: 0, outstanding: 0 }
  );

  return NextResponse.json({
    success: true,
    from: from || null,
    to: to || null,
    generatedAt: new Date().toISOString(),
    months: monthRows,
    daily: dailyRows,
    statusOverTime: statusRows,
    products: productRows,
    paymentSplit: [
      { method: "Prepaid", amount: paidTotal },
      { method: "COD", amount: codTotal },
    ],
    totals: {
      ...totals,
      aov: totals.pureOrders > 0 ? Math.round(totals.pureSale / totals.pureOrders) : 0,
      deliveredPct: pct(totals.delivered, totals.totalOrders),
      cancelledPct: pct(totals.cancelled, totals.totalOrders),
      rtoPct: pct(totals.rto, totals.totalOrders),
    },
  });
}
