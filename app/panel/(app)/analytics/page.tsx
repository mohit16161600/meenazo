"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, ErrorState, PageHeader, Skeleton } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import {
  ColumnChart,
  MetricTile,
  MultiLineChart,
  VIZ,
  inr,
} from "@/app/panel/_components/charts";
import { cn } from "@/utils/cn";

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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Pure sales (delivered-able)" value={inr(t.pureSale)} icon={<Icon name="rupee" size={16} />} tone="brand" />
        <MetricTile label="Pure orders" value={String(t.pureOrders)} icon={<Icon name="shopping-bag" size={16} />} tone="blue" />
        <MetricTile label="Delivered rate" value={`${t.deliveredPct}%`} icon={<Icon name="check" size={16} />} tone="brand" />
        <MetricTile label="RTO + cancelled" value={`${Math.round((t.rtoPct + t.cancelledPct) * 10) / 10}%`} icon={<Icon name="alert" size={16} />} tone="red" invert />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-ink">Orders and sales per day</h2>
          <span className="text-xs text-muted">Two measures, one scale</span>
        </div>
        <Card className="p-6">
          <MultiLineChart
            data={data.daily}
            series={[{ key: "orders", label: "Orders", color: VIZ.series1 }]}
            format={(v) => String(Math.round(v))}
          />
        </Card>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-ink">Orders by status over time</h2>
          {statusSeries.length ? (
            <MultiLineChart data={data.statusOverTime} series={statusSeries} format={(v) => String(Math.round(v))} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">No orders in this range</p>
          )}
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-base font-bold text-ink">Sales by payment method</h2>
          <ColumnChart
            data={data.paymentSplit.map((s, i) => ({
              label: s.method,
              value: s.amount,
              color: i === 0 ? VIZ.series1 : VIZ.series3,
            }))}
            format={inr}
          />
        </Card>
      </section>

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
