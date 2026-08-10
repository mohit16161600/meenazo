"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, ErrorState, PageHeader, TableSkeleton } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import { ORDER_STATUSES } from "@/lib/panelModels";
import { PAYMENT_TYPES, paymentTypeOf, balanceDue, type PaymentType } from "@/lib/paymentType";
import { VIZ, inr } from "@/app/panel/_components/charts";
import { cn } from "@/utils/cn";

interface Filters {
  q: string;
  status: string;
  payment: string;
  from: string;
  to: string;
  min: string;
  max: string;
  synced: string;
  sort: string;
}

// sort "serial" = the register view: S.No ascending, newest order at the bottom.
const EMPTY: Filters = { q: "", status: "", payment: "", from: "", to: "", min: "", max: "", synced: "", sort: "serial" };

const statusTone: Record<string, "green" | "amber" | "blue" | "red" | "neutral"> = {
  delivered: "green",
  confirmed: "blue",
  processing: "blue",
  shipped: "blue",
  out_for_delivery: "amber",
  pending: "amber",
  cancelled: "red",
  ndr: "red",
  returned: "red",
};
const paymentColor: Record<PaymentType, string> = {
  prepaid: VIZ.series1,
  partial: VIZ.series2,
  cod: VIZ.series3,
};

const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
// min-h-11 keeps every control at a 44px touch target; the visible ring
// replaces the outline we suppress (never remove one without the other).
const inputCls =
  "w-full min-h-[44px] rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25";

export default function OrdersPage() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Seed from the URL so dashboard links like ?payment=cod land pre-filtered.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const seeded: Filters = { ...EMPTY };
    (Object.keys(EMPTY) as (keyof Filters)[]).forEach((k) => {
      const v = p.get(k);
      if (v) seeded[k] = v;
    });
    setFilters(seeded);
    setApplied(seeded);
    if (seeded.from || seeded.to || seeded.min || seeded.max || seeded.synced) setShowAdvanced(true);
  }, []);

  const load = useCallback(async (f: Filters) => {
    setLoading(true);
    setError(null);
    const p = new URLSearchParams();
    (Object.entries(f) as [keyof Filters, string][]).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === EMPTY.sort)) p.set(k, v);
    });
    p.set("limit", "200");
    try {
      const res = await apiGet<{ items: Record<string, unknown>[]; total: number; revenue?: number }>(
        `/orders?${p.toString()}`
      );
      setRows(res.items ?? []);
      setTotal(res.total ?? res.items?.length ?? 0);
      setRevenue(res.revenue ?? 0);
    } catch (e) {
      setError((e as ApiError).message ?? "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(applied);
  }, [applied, load]);

  // Free-text is debounced; the rest apply on change/submit.
  useEffect(() => {
    const t = setTimeout(() => setApplied((a) => (a.q === filters.q ? a : { ...filters })), 300);
    return () => clearTimeout(t);
  }, [filters]);

  const activeCount = useMemo(
    () =>
      (Object.keys(EMPTY) as (keyof Filters)[]).filter(
        (k) => k !== "sort" && applied[k] !== EMPTY[k]
      ).length,
    [applied]
  );

  const set = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setApplied(next);
  };

  /** Export exactly what is on screen - the current filter, not the whole table. */
  function exportCsv() {
    const headers = ["S No", "Order", "Date", "Customer", "Phone", "City", "State", "Payment", "Paid", "Due", "Total", "Status", "EasyEcom"];
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((o) => {
      const due = balanceDue(o);
      const total = Number(o.total ?? 0);
      return [
        o.id,
        o.orderNumber ?? o.id,
        String(o.createdAt ?? "").slice(0, 10),
        o.customerName ?? "",
        o.customerMobile ?? "",
        o.city ?? "",
        o.state ?? "",
        PAYMENT_TYPES.find((t) => t.value === paymentTypeOf(o))?.label ?? "",
        total - due,
        due,
        total,
        o.status ?? "",
        o.easyecomSynced ? "Pushed" : o.easyecomError ? "Failing" : "Queued",
      ].map(esc).join(",");
    });
    // The BOM keeps Excel from mangling the rupee sign and Hindi names.
    const url = URL.createObjectURL(
      new Blob(["﻿" + [headers.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `meenazo-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={
          loading
            ? "Loading…"
            : `${total} ${total === 1 ? "order" : "orders"}${activeCount ? " matching your filters" : ""} · ${inr(revenue)} value`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" icon="upload" onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
            <Button variant="outline" icon="refresh" onClick={() => load(applied)} loading={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      {/* Status tabs - the filter people reach for most, one click away. */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ value: "", label: "All" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: label(s) }))].map((t) => (
          <button
            key={t.value || "all"}
            type="button"
            onClick={() => set({ status: t.value })}
            aria-pressed={filters.status === t.value}
            className={cn(
              "min-h-[38px] rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              filters.status === t.value ? "bg-brand text-white" : "border border-line bg-white text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="mb-5 p-4">
        {/* Primary row: search + the two filters used most. */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <Icon name="search" size={16} />
            </span>
            <input
              className={cn(inputCls, "pl-9")}
              placeholder="Order number, name, phone, city, pincode…"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>

          <select className={cn(inputCls, "w-auto")} value={filters.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>

          <select className={cn(inputCls, "w-auto")} value={filters.payment} onChange={(e) => set({ payment: e.target.value })}>
            <option value="">All payments</option>
            {PAYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            aria-expanded={showAdvanced}
            aria-controls="order-advanced-filters"
            className={cn(
              "inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
              showAdvanced ? "border-brand/40 bg-mint text-brand-dark" : "border-line bg-white text-muted hover:text-ink"
            )}
          >
            <Icon name="sliders" size={15} /> Advanced
          </button>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setFilters(EMPTY);
                setApplied(EMPTY);
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-muted hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <Icon name="x" size={15} /> Clear ({activeCount})
            </button>
          )}
        </div>

        {showAdvanced && (
          <div id="order-advanced-filters" className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">From date</span>
              <input type="date" className={inputCls} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">To date</span>
              <input type="date" className={inputCls} value={filters.to} onChange={(e) => set({ to: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Min amount (₹)</span>
              <input type="number" min={0} className={inputCls} value={filters.min} onChange={(e) => set({ min: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Max amount (₹)</span>
              <input type="number" min={0} className={inputCls} value={filters.max} onChange={(e) => set({ max: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">EasyEcom</span>
              <select className={inputCls} value={filters.synced} onChange={(e) => set({ synced: e.target.value })}>
                <option value="">Any</option>
                <option value="1">Pushed</option>
                <option value="0">Not pushed yet</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Sort by</span>
              <select className={inputCls} value={filters.sort} onChange={(e) => set({ sort: e.target.value })}>
                <option value="serial">S.No order (newest last)</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="high">Highest value</option>
                <option value="low">Lowest value</option>
              </select>
            </label>
          </div>
        )}
      </Card>

      {error && (
        <Card>
          <ErrorState
            title="Orders couldn't load"
            message={`${error}. Check your connection, then try again.`}
            onRetry={() => load(applied)}
          />
        </Card>
      )}

      {!error && (
        <Card className="overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : rows.length === 0 ? (
            // Empty state: why it is empty, and the one action that fixes it.
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand">
                <Icon name={activeCount ? "search" : "shopping-bag"} size={26} />
              </div>
              <p className="mt-4 font-semibold text-ink">
                {activeCount ? "No orders match these filters" : "No orders yet"}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {activeCount
                  ? "Nothing matched your search. Widen the date range or clear a filter to see more."
                  : "Orders placed on the website will appear here automatically."}
              </p>
              {activeCount > 0 && (
                <Button
                  variant="outline"
                  icon="x"
                  className="mt-5"
                  onClick={() => {
                    setFilters(EMPTY);
                    setApplied(EMPTY);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/60 text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">S.No</th>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">EasyEcom</th>
                    <th className="px-4 py-3 text-right font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const type = paymentTypeOf(o);
                    const due = balanceDue(o);
                    const created = String(o.createdAt ?? "").slice(0, 10);
                    return (
                      <tr key={String(o.id)} className="border-b border-line/60 last:border-0 hover:bg-soft/70">
                        <td className="px-4 py-3 font-semibold tabular-nums text-muted">{String(o.id)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/panel/orders/${o.id}`} className="font-mono text-xs font-bold text-brand hover:underline">
                            {String(o.orderNumber ?? o.id)}
                          </Link>
                          <div className="text-xs text-muted">{created}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-ink">{String(o.customerName ?? " - ")}</div>
                          <div className="text-xs text-muted">
                            {String(o.customerMobile ?? "")}
                            {o.city ? ` · ${String(o.city)}` : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                            <span className="h-2 w-2 rounded-full" style={{ background: paymentColor[type] }} aria-hidden />
                            {PAYMENT_TYPES.find((t) => t.value === type)?.label}
                          </span>
                          {due > 0 && <div className="text-xs text-muted">{inr(due)} to collect</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {inr(Number(o.total ?? 0))}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone[String(o.status)] ?? "neutral"}>{label(String(o.status ?? "pending"))}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {o.easyecomSynced ? (
                            <Badge tone="green">Pushed</Badge>
                          ) : o.easyecomError ? (
                            <Badge tone="red">Failing</Badge>
                          ) : (
                            <Badge tone="amber">Queued</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/panel/orders/${o.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:border-brand/40 hover:bg-mint"
                          >
                            Open <Icon name="chevron" size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      <div className="h-6" />
    </div>
  );
}
