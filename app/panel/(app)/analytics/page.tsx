"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, ErrorState, PageHeader, Skeleton } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import {
  BarList,
  ColumnChart,
  MetricTile,
  MultiLineChart,
  Pipeline,
  ShareBar,
  VIZ,
  inr,
} from "@/app/panel/_components/charts";
import { isoDaysAgo } from "@/app/panel/_lib/datetime";
import { cn } from "@/utils/cn";

/** "62%" — a share of a whole, with a zero denominator reading as "—". */
function share(part: number, whole: number): string {
  if (!Number.isFinite(whole) || whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

/**
 * Section heading + the one line that says how to READ the thing below it.
 * A chart nobody can interpret is decoration; every section on this page has to
 * answer "so what?" in plain words, because the person reading it is running
 * the business, not analysing it.
 */
function SectionHead({
  title,
  explain,
  right,
}: {
  title: string;
  explain: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{explain}</p>
      </div>
      {right}
    </div>
  );
}

interface MonthRow {
  month: string;
  totalOrders: number; pureOrders: number;
  cancelled: number; cancelledPct: number;
  delivered: number; deliveredPct: number;
  rto: number; rtoPct: number;
  pending: number; pendingPct: number;
  inTransit: number;
  totalSale: number; pureSale: number;
  prepaidAmount: number; prepaidPct: number;
  codAmount: number; codPct: number;
  collected: number; outstanding: number;
  deliveredPrepaid: number; deliveredCod: number;
  rtoPrepaid: number; rtoCod: number;
  aov: number; customers: number;
}
interface ProductRow {
  name: string; totalOrders: number; pureOrders: number;
  revenue: number; pureSales: number; quantity: number; pending: number;
}
interface Data {
  generatedAt: string;
  months: MonthRow[];
  daily: { date: string; orders: number; sales: number }[];
  statusOverTime: Record<string, unknown>[];
  products: ProductRow[];
  paymentSplit: { method: string; amount: number }[];
  totals: {
    totalOrders: number; pureOrders: number; cancelled: number; delivered: number; rto: number;
    totalSale: number; pureSale: number; collected: number; outstanding: number;
    aov: number; deliveredPct: number; cancelledPct: number; rtoPct: number;
  };
}

/** Every column of the month table, in one place: header, value, and format. */
const MONTH_COLUMNS: {
  key: keyof MonthRow;
  label: string;
  money?: boolean;
  percent?: boolean;
  tone?: "good" | "bad" | "muted";
}[] = [
  { key: "month", label: "Month" },
  { key: "totalOrders", label: "Total orders" },
  { key: "pureOrders", label: "Pure orders", tone: "good" },
  { key: "cancelled", label: "Cancelled", tone: "bad" },
  { key: "cancelledPct", label: "Cancelled %", percent: true, tone: "bad" },
  { key: "delivered", label: "Delivered", tone: "good" },
  { key: "deliveredPct", label: "Delivered %", percent: true, tone: "good" },
  { key: "rto", label: "RTO", tone: "bad" },
  { key: "rtoPct", label: "RTO %", percent: true, tone: "bad" },
  { key: "pending", label: "Pending", tone: "muted" },
  { key: "pendingPct", label: "Pending %", percent: true, tone: "muted" },
  { key: "inTransit", label: "In transit", tone: "muted" },
  { key: "totalSale", label: "Total sale", money: true },
  { key: "pureSale", label: "Pure sale", money: true, tone: "good" },
  { key: "aov", label: "AOV", money: true },
  { key: "prepaidAmount", label: "Prepaid amount", money: true },
  { key: "prepaidPct", label: "Prepaid %", percent: true },
  { key: "codAmount", label: "COD amount", money: true },
  { key: "codPct", label: "COD %", percent: true },
  { key: "collected", label: "Collected", money: true, tone: "good" },
  { key: "outstanding", label: "Outstanding", money: true, tone: "bad" },
  { key: "deliveredPrepaid", label: "Delivered prepaid", money: true },
  { key: "deliveredCod", label: "Delivered COD", money: true },
  { key: "rtoPrepaid", label: "RTO prepaid", money: true, tone: "bad" },
  { key: "rtoCod", label: "RTO COD", money: true, tone: "bad" },
  { key: "customers", label: "Buyers" },
];

const toneClass: Record<string, string> = {
  good: "text-emerald-700",
  bad: "text-red-600",
  muted: "text-muted",
};

const fmtCell = (v: unknown, col: (typeof MONTH_COLUMNS)[number]) => {
  if (col.money) return inr(Number(v ?? 0));
  if (col.percent) return `${Number(v ?? 0)}%`;
  return String(v ?? "-");
};

/** Build and download a CSV client-side - no server round-trip needed. */
function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams();
    if (f) p.set("from", f);
    if (t) p.set("to", t);
    try {
      setData(await apiGet<Data & { success: boolean }>(`/analytics?${p.toString()}`));
    } catch (e) {
      setError((e as ApiError).message ?? "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(from, to); }, [from, to, load]);

  const statusKeys = useMemo(() => {
    if (!data) return [];
    const keys = new Set<string>();
    data.statusOverTime.forEach((r) => Object.keys(r).forEach((k) => k !== "date" && keys.add(k)));
    return [...keys];
  }, [data]);

  const statusSeries = useMemo(() => {
    const palette: Record<string, string> = {
      delivered: VIZ.good, pending: VIZ.warning, cancelled: VIZ.critical,
      returned: VIZ.serious, shipped: VIZ.series1, processing: VIZ.series1,
      confirmed: VIZ.series3, out_for_delivery: VIZ.series2, ndr: VIZ.serious,
    };
    // Cap at 6 series: past that a line chart stops being readable and the
    // table below carries the rest.
    return statusKeys.slice(0, 6).map((k) => ({
      key: k,
      label: k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
      color: palette[k] ?? VIZ.muted,
    }));
  }, [statusKeys]);

  if (error)
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Month-by-month business performance" />
        <Card>
          <ErrorState title="Analytics couldn't load" message={`${error} Check your connection, then try again.`} onRetry={() => load(from, to)} />
        </Card>
      </div>
    );

  if (loading && !data)
    return (
      <div>
        <PageHeader title="Analytics" subtitle="Month-by-month business performance" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-8 w-8 rounded-xl" /><Skeleton className="mt-4 h-7 w-24" /></Card>
          ))}
        </div>
        <Card className="mt-6 p-5"><Skeleton className="h-64 w-full" /></Card>
        <span className="sr-only" role="status" aria-live="polite">Loading analytics</span>
      </div>
    );

  if (!data) return null;
  const t = data.totals;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Month-by-month business performance"
        actions={
          <Button
            variant="outline"
            icon="upload"
            onClick={() =>
              downloadCsv(
                `meenazo-analytics-${new Date().toISOString().slice(0, 10)}.csv`,
                MONTH_COLUMNS.map((c) => c.label),
                data.months.map((m) => MONTH_COLUMNS.map((c) => m[c.key] as string | number))
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      {/* Date range - one row above everything it filters. */}
      <Card className="mb-6 flex flex-wrap items-end gap-4 p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="min-h-[44px] rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="min-h-[44px] rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25" />
        </label>
        {/* Presets: nobody types two dates to answer "how was last week?" */}
        <div className="flex flex-wrap items-center gap-1.5 pb-0.5">
          {([
            { label: "7 days", days: 6 },
            { label: "30 days", days: 29 },
            { label: "90 days", days: 89 },
          ] as const).map((p) => {
            const start = isoDaysAgo(p.days);
            const on = from === start && to === "";
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setFrom(on ? "" : start);
                  setTo("");
                }}
                className={cn(
                  "min-h-[38px] rounded-xl border px-3 text-[13px] font-semibold transition-colors",
                  on ? "border-brand/40 bg-mint text-brand-dark" : "border-line bg-white text-muted hover:text-ink"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {(from || to) && (
          <button type="button" onClick={() => { setFrom(""); setTo(""); }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <Icon name="x" size={15} /> Clear dates
          </button>
        )}
        <span className="ml-auto text-xs text-muted">
          {from || to ? "Filtered range" : "All time"} · {data.months.length} month{data.months.length === 1 ? "" : "s"}
        </span>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricTile label="Pure sales" value={inr(t.pureSale)} icon={<Icon name="rupee" size={16} />} tone="brand" />
        <MetricTile label="Pure orders" value={String(t.pureOrders)} icon={<Icon name="shopping-bag" size={16} />} tone="blue" />
        <MetricTile label="Average order value" value={inr(t.aov)} icon={<Icon name="activity" size={16} />} tone="violet" />
        <MetricTile label="Delivered rate" value={`${t.deliveredPct}%`} icon={<Icon name="check" size={16} />} tone="brand" />
        <MetricTile
          label="RTO + cancelled"
          value={`${Math.round((t.rtoPct + t.cancelledPct) * 10) / 10}%`}
          icon={<Icon name="alert" size={16} />}
          tone="red"
          invert
        />
        <MetricTile label="Still to collect" value={inr(t.outstanding)} icon={<Icon name="clock" size={16} />} tone="amber" invert />
      </div>

      <p className="mt-2.5 text-[12.5px] leading-snug text-muted">
        <span className="font-semibold text-ink">Pure</span> figures exclude cancelled and RTO orders — they are what
        the business actually keeps. <span className="font-semibold text-ink">Still to collect</span> is COD money the
        courier hasn&apos;t handed over yet.
      </p>

      {/* ---- Month on month: the comparison the tiles above can't make ----
          The figures above are totals for the whole filtered range, so they
          have nothing to be compared against. These two months do. Months come
          back sorted ascending, so the last entry is the newest. */}
      {data.months.length >= 2 &&
        (() => {
          const last = data.months[data.months.length - 1];
          const prev = data.months[data.months.length - 2];
          return (
            <section className="mt-8">
              <SectionHead
                title={`${last.month} vs ${prev.month}`}
                explain="The newest month against the one before it. The arrow on each tile is that change — green is the direction you want, whichever way the number moved."
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                <MetricTile label="Pure sales" value={inr(last.pureSale)} prev={prev.pureSale} icon={<Icon name="rupee" size={16} />} tone="brand" />
                <MetricTile label="Pure orders" value={String(last.pureOrders)} prev={prev.pureOrders} icon={<Icon name="shopping-bag" size={16} />} tone="blue" />
                <MetricTile label="Average order" value={inr(last.aov)} prev={prev.aov} icon={<Icon name="activity" size={16} />} tone="violet" />
                <MetricTile label="Delivered" value={String(last.delivered)} prev={prev.delivered} icon={<Icon name="check" size={16} />} tone="brand" />
                {/* invert: a rise in these is a fall in the business. */}
                <MetricTile label="Cancelled" value={String(last.cancelled)} prev={prev.cancelled} icon={<Icon name="x" size={16} />} tone="red" invert />
                <MetricTile label="RTO" value={String(last.rto)} prev={prev.rto} icon={<Icon name="alert" size={16} />} tone="red" invert />
              </div>
            </section>
          );
        })()}

      {/* ---- Order journey: where orders are, and where they leak ---- */}
      <section className="mt-8">
        <SectionHead
          title="Order journey"
          explain="Every order that came in, and how far down the pipeline it got. A big drop between two stages is where you're losing money."
        />
        <Card className="p-5">
          {/* `prev: 0` on every stage on purpose. Pipeline renders a non-zero
              `prev` as "Prev N · −25%", which means "the previous PERIOD" — on a
              funnel that reads as a time comparison the numbers are not. The
              share belongs in the label, where it says what it actually is. */}
          <Pipeline
            stages={[
              { key: "placed", label: "Placed", value: t.totalOrders, prev: 0, color: VIZ.series1, href: "/panel/orders" },
              { key: "pure", label: `Live — ${share(t.pureOrders, t.totalOrders)} of placed`, value: t.pureOrders, prev: 0, color: VIZ.series2, href: "/panel/orders" },
              { key: "delivered", label: `Delivered — ${share(t.delivered, t.pureOrders)} of live`, value: t.delivered, prev: 0, color: VIZ.series3, href: "/panel/orders?status=delivered" },
              { key: "cancelled", label: `Cancelled — ${share(t.cancelled, t.totalOrders)} of placed`, value: t.cancelled, prev: 0, color: VIZ.critical, href: "/panel/orders?status=cancelled" },
              { key: "rto", label: `RTO / returned — ${share(t.rto, t.totalOrders)} of placed`, value: t.rto, prev: 0, color: VIZ.muted, href: "/panel/orders?status=returned" },
            ]}
          />
        </Card>
      </section>

      {/* ---- Daily trend: two measures, TWO scales ----
          Orders (single digits) and sales (tens of thousands) were sharing one
          axis, which flattened the money line into the baseline and made the
          chart say nothing. They get one plot each instead. */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div>
          <SectionHead
            title="Sales per day"
            explain="Rupees ordered each day, cancelled orders already removed. Look for the shape over the week, not the single days."
          />
          <Card className="p-5">
            <MultiLineChart
              data={data.daily}
              series={[{ key: "sales", label: "Sales (₹)", color: VIZ.series1 }]}
              format={inr}
            />
          </Card>
        </div>
        <div>
          <SectionHead
            title="Orders per day"
            explain="Orders taken each day (cancelled ones removed) — same period as the left, but on its own scale so small numbers stay readable."
          />
          <Card className="p-5">
            <MultiLineChart
              data={data.daily}
              series={[{ key: "orders", label: "Orders", color: VIZ.series2 }]}
              format={(v) => String(Math.round(v))}
            />
          </Card>
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHead
            title="Orders by status over time"
            explain="Each line is one status. A rising 'pending' line means orders are piling up before dispatch; a rising 'cancelled' line needs a look at the cause."
          />
          <Card className="p-5">
            {statusSeries.length ? (
              <MultiLineChart data={data.statusOverTime} series={statusSeries} format={(v) => String(Math.round(v))} />
            ) : (
              <p className="py-10 text-center text-sm text-muted">No orders in this range</p>
            )}
          </Card>
        </div>

        <div>
          <SectionHead
            title="Prepaid vs COD"
            explain="Share of order value by how it's paid. More prepaid = less RTO risk and no money waiting with couriers."
          />
          <Card className="space-y-5 p-5">
            <ShareBar
              segments={data.paymentSplit.map((s, i) => ({
                label: s.method,
                value: s.amount,
                color: i === 0 ? VIZ.series1 : VIZ.series3,
              }))}
              format={inr}
            />
            {/* Deliberately NOT the same split again as a column chart — that
                is the bar above, redrawn. This answers the next question:
                of all that money, how much have we actually got? */}
            <div className="border-t border-line pt-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                Money in hand vs still out
              </p>
              <ColumnChart
                height={150}
                data={[
                  { label: "Collected", value: t.collected, color: VIZ.series3 },
                  { label: "Outstanding", value: t.outstanding, color: VIZ.warning },
                ]}
                format={inr}
              />
              <p className="mt-2 text-[12px] leading-snug text-muted">
                Outstanding is COD money the courier still has to hand over. It is already counted
                in sales above, but it is not in your account yet.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* ---- Top products at a glance, before the full table ---- */}
      {data.products.length > 0 && (
        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div>
            <SectionHead
              title="Top products by sales"
              explain="Pure sales — cancelled and RTO orders removed — so this ranks what actually earns."
            />
            <Card className="p-5">
              <BarList
                data={[...data.products]
                  .sort((a, b) => b.pureSales - a.pureSales)
                  .slice(0, 6)
                  .map((p, i) => ({
                    label: p.name,
                    value: p.pureSales,
                    color: [VIZ.series1, VIZ.series2, VIZ.series3][i % 3],
                    hint: `${p.pureOrders} pure order${p.pureOrders === 1 ? "" : "s"} · ${p.quantity} unit${p.quantity === 1 ? "" : "s"}`,
                  }))}
                format={inr}
              />
            </Card>
          </div>
          <div>
            <SectionHead
              title="Top products by units"
              explain="Volume, not value. A product high here but low on the left is cheap but popular — good for bundles."
            />
            <Card className="p-5">
              <BarList
                data={[...data.products]
                  .sort((a, b) => b.quantity - a.quantity)
                  .slice(0, 6)
                  .map((p, i) => ({
                    label: p.name,
                    value: p.quantity,
                    color: [VIZ.series2, VIZ.series3, VIZ.series1][i % 3],
                    hint: `${inr(p.pureSales)} pure sales`,
                  }))}
                format={(v) => `${v} unit${v === 1 ? "" : "s"}`}
              />
            </Card>
          </div>
        </section>
      )}

      {/* The deep table: every month, every measure. */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">Order analytics by month</h2>
          <span className="text-xs text-muted">Scroll sideways for every column</span>
        </div>
        <Card className="overflow-hidden">
          {data.months.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No orders in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/70 text-[11px] uppercase tracking-wide text-muted">
                    {MONTH_COLUMNS.map((c) => (
                      <th key={String(c.key)} className={cn("whitespace-nowrap px-3 py-3 font-semibold", c.key !== "month" && "text-right")}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.months.map((m) => (
                    <tr key={m.month} className="border-b border-line/60 last:border-0 hover:bg-soft/60">
                      {MONTH_COLUMNS.map((c) => (
                        <td
                          key={String(c.key)}
                          className={cn(
                            "whitespace-nowrap px-3 py-2.5",
                            c.key === "month" ? "font-semibold text-ink" : "text-right",
                            c.key !== "month" && c.tone ? toneClass[c.tone] : "text-ink"
                          )}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {fmtCell(m[c.key], c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-line bg-soft/50 font-bold">
                    <td className="whitespace-nowrap px-3 py-3 text-ink">Total</td>
                    {MONTH_COLUMNS.slice(1).map((c) => {
                      // Percentages and AOV are ratios: summing them is meaningless,
                      // so the footer shows the recomputed overall figure instead.
                      if (c.percent || c.key === "aov") {
                        const v =
                          c.key === "aov" ? t.aov
                          : c.key === "deliveredPct" ? t.deliveredPct
                          : c.key === "cancelledPct" ? t.cancelledPct
                          : c.key === "rtoPct" ? t.rtoPct
                          : null;
                        return (
                          <td key={String(c.key)} className="px-3 py-3 text-right text-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {v === null ? "-" : c.key === "aov" ? inr(v) : `${v}%`}
                          </td>
                        );
                      }
                      const sum = data.months.reduce((a, m) => a + Number(m[c.key] ?? 0), 0);
                      return (
                        <td key={String(c.key)} className="px-3 py-3 text-right text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {c.money ? inr(sum) : sum}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>

      {/* Product-wise performance. */}
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">Product performance</h2>
          <Button
            variant="ghost"
            icon="upload"
            className="!min-h-0 !px-2 !py-1 text-xs"
            onClick={() =>
              downloadCsv(
                `meenazo-products-${new Date().toISOString().slice(0, 10)}.csv`,
                ["Product", "Total orders", "Pure orders", "Revenue", "Pure sales", "Quantity", "Pending"],
                data.products.map((p) => [p.name, p.totalOrders, p.pureOrders, p.revenue, p.pureSales, p.quantity, p.pending])
              )
            }
          >
            Export
          </Button>
        </div>
        <Card className="overflow-hidden">
          {data.products.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">No product sales in this range.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/70 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 text-right font-semibold">Total orders</th>
                    <th className="px-4 py-3 text-right font-semibold">Pure orders</th>
                    <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                    <th className="px-4 py-3 text-right font-semibold">Pure sales</th>
                    <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-right font-semibold">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.name} className="border-b border-line/60 last:border-0 hover:bg-soft/60">
                      <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                      <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{p.totalOrders}</td>
                      <td className="px-4 py-3 text-right text-emerald-700" style={{ fontVariantNumeric: "tabular-nums" }}>{p.pureOrders}</td>
                      <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{inr(p.revenue)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700" style={{ fontVariantNumeric: "tabular-nums" }}>{inr(p.pureSales)}</td>
                      <td className="px-4 py-3 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{p.quantity}</td>
                      <td className="px-4 py-3 text-right text-amber-600" style={{ fontVariantNumeric: "tabular-nums" }}>{p.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
      <div className="h-8" />
    </div>
  );
}
