"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, ErrorState, PageHeader, Skeleton } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import { useToast } from "@/app/panel/_components/toast";
import { canAccess } from "@/lib/panelRoles";
import { PAYMENT_TYPES, paymentTypeOf, type PaymentType } from "@/lib/paymentType";
import {
  BarList,
  HeroFigure,
  MetricTile,
  Pipeline,
  ShareBar,
  TrendChart,
  VIZ,
  inr,
  type TrendPoint,
} from "@/app/panel/_components/charts";
import { cn } from "@/utils/cn";

interface Money { sales: number; collected: number; due: number; orders: number; cancelled: number }
interface Data {
  role: string; days: number; generatedAt: string;
  counts: Record<string, number>;
  allTime: { sales: number; prepaid: number; cod: number; collected: number; due: number; orders: number };
  current: Money; previous: Money; today: Money; yesterday: Money;
  statusSummary: { status: string; orders: number; prev: number }[];
  payments: { type: PaymentType; orders: number; revenue: number; collected: number; due: number }[];
  trend: TrendPoint[];
  topProducts: { name: string; units: number; revenue: number }[];
  topStates: { name: string; revenue: number }[];
  customers: { total: number; verified: number; unverified: number; newInPeriod: number; prevNew: number; today: number; yesterday: number; repeat: number };
  carts: { active: number; abandoned: number; converted: number };
  wishlistItems: number;
  fulfillment: { pushed: number; queued: number; failing: number };
  lowStock: Record<string, unknown>[];
  outOfStock: number;
  insights: { aov: number; prepaidRatio: number; verifiedRate: number; unverifiedRate: number; repeatRate: number; cancelRate: number; collectedRate: number };
  recentOrders: Record<string, unknown>[];
}

const statusTone: Record<string, "green" | "amber" | "blue" | "red" | "neutral"> = {
  delivered: "green", confirmed: "blue", processing: "blue", shipped: "blue",
  out_for_delivery: "amber", pending: "amber", cancelled: "red", ndr: "red", returned: "red",
};
const statusColor: Record<string, string> = {
  delivered: VIZ.good, confirmed: VIZ.series1, processing: VIZ.series1, shipped: VIZ.series1,
  out_for_delivery: VIZ.warning, pending: VIZ.warning, ndr: VIZ.serious,
  cancelled: VIZ.critical, returned: VIZ.critical,
};
const paymentColor: Record<PaymentType, string> = {
  prepaid: VIZ.series1, partial: VIZ.series2, cod: VIZ.series3,
};
const RANGES = [
  { days: 7, label: "7 days" }, { days: 30, label: "30 days" },
  { days: 90, label: "90 days" }, { days: 365, label: "1 year" },
];
const label = (s: string) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const pct = (now: number, prev: number): number | null =>
  prev > 0 ? Math.round(((now - prev) / prev) * 100) : null;

/** Section heading with generous space above - the page's main rhythm. */
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [dispatching, setDispatching] = useState(false);

  const load = useCallback((d: number) => {
    setError(null);
    apiGet<Data & { success: boolean }>(`/dashboard?days=${d}`)
      .then(setData)
      .catch((e: ApiError) => setError(e.message));
  }, []);

  useEffect(() => { load(days); }, [days, load]);
  useEffect(() => {
    const t = setInterval(() => load(days), 60_000);
    return () => clearInterval(t);
  }, [days, load]);

  async function runDispatch() {
    setDispatching(true);
    try {
      const res = await fetch("/api/easyecom/dispatch?force=1", { method: "POST", credentials: "same-origin" });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean; message?: string;
        report?: { configured: boolean; pushed: number; failed: number; scanned: number };
      };
      if (!res.ok || json.success === false) throw new Error(json.message || `Dispatch failed (${res.status})`);
      const r = json.report;
      if (r && !r.configured) toast.push("error", "EasyEcom is not configured. Open System status to fix it.");
      else if (r) toast.push("success", `EasyEcom: ${r.pushed} pushed, ${r.failed} failed (${r.scanned} scanned).`);
      load(days);
    } catch (e) {
      toast.push("error", (e as Error).message ?? "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  }

  if (error)
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Real-time business overview" />
        <Card>
          <ErrorState
            title="The dashboard couldn't load"
            message={`${error}. Check that the database is reachable, then try again.`}
            onRetry={() => load(days)}
          />
        </Card>
      </div>
    );

  if (!data)
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Real-time business overview" />
        <div className="grid gap-5 lg:grid-cols-4">
          <Card className="p-6 lg:col-span-1"><Skeleton className="h-24 w-full" /></Card>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5"><Skeleton className="h-8 w-8 rounded-xl" /><Skeleton className="mt-4 h-7 w-24" /></Card>
          ))}
        </div>
        <span className="sr-only" role="status" aria-live="polite">Loading dashboard</span>
      </div>
    );

  const role = data.role;
  const canOrders = canAccess(role, "orders");
  const canCustomers = canAccess(role, "customers");
  const canProducts = canAccess(role, "products");
  const { allTime, current, previous, today, yesterday, insights, customers, carts } = data;
  const stamp = new Date(data.generatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const catalog = [
    { label: "Products", key: "products", href: "/panel/products", icon: "box" },
    { label: "Categories", key: "categories", href: "/panel/categories", icon: "layers" },
    { label: "Blog posts", key: "blog", href: "/panel/blog", icon: "file-text" },
    { label: "Coupons", key: "coupons", href: "/panel/coupons", icon: "ticket" },
    { label: "Banners", key: "banners", href: "/panel/banners", icon: "image" },
    { label: "Testimonials", key: "testimonials", href: "/panel/testimonials", icon: "message" },
    { label: "FAQs", key: "faqs", href: "/panel/faqs", icon: "help" },
  ].filter((c) => canAccess(role, c.key));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Real-time business overview"
        actions={
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden /> Live · {stamp}
            </span>
            {canOrders && (
              <Button variant="outline" icon="upload" onClick={runDispatch} loading={dispatching}>
                Send due orders
              </Button>
            )}
          </div>
        }
      />

      {canOrders && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={cn(
                "min-h-[44px] rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2",
                days === r.days ? "bg-brand text-white" : "border border-line bg-white text-muted hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted">compared with the previous {data.days} days</span>
        </div>
      )}

      {/* One focal number, then three supporting figures. */}
      {canOrders && (
        <div className="grid gap-5 lg:grid-cols-4">
          <HeroFigure
            label="Total sales"
            value={inr(allTime.sales)}
            delta={pct(current.sales, previous.sales)}
            sub={`${inr(current.sales)} in the last ${data.days} days`}
            icon={<Icon name="rupee" size={16} />}
          />
          <MetricTile
            label="Orders (excl. cancelled)"
            value={String(allTime.orders)}
            prev={previous.orders}
            icon={<Icon name="shopping-bag" size={16} />}
            tone="blue"
            href="/panel/orders"
          />
          <MetricTile
            label="Yet to collect"
            value={inr(allTime.due)}
            icon={<Icon name="clock" size={16} />}
            tone="amber"
            href="/panel/orders?payment=cod"
          />
          <MetricTile
            label="Average order value"
            value={inr(insights.aov)}
            icon={<Icon name="star" size={16} />}
            tone="violet"
          />
        </div>
      )}

      {/* Revenue trend gets the width it needs; payment mix sits beside it. */}
      {canOrders && (
        <Section title="Revenue" hint={`Daily · last ${data.days} days`}>
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <TrendChart data={data.trend} height={240} />
            </Card>
            <Card className="p-6">
              <h3 className="font-bold text-ink">Payment mix</h3>
              <p className="mb-5 mt-1 text-xs text-muted">How customers are paying</p>
              <ShareBar
                segments={data.payments.map((p) => ({
                  label: PAYMENT_TYPES.find((t) => t.value === p.type)?.label ?? p.type,
                  value: p.orders,
                  color: paymentColor[p.type],
                }))}
                format={(v) => `${v} orders`}
              />
              <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Prepaid</dt>
                  <dd className="font-bold text-ink">{inr(allTime.prepaid)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">COD</dt>
                  <dd className="font-bold text-ink">{inr(allTime.cod)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Collected</dt>
                  <dd className="font-bold text-ink">{inr(allTime.collected)}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </Section>
      )}

      {/* Nine statuses as ONE card rather than nine competing tiles. */}
      {canOrders && (
        <Section title="Order pipeline" hint={`Last ${data.days} days`}>
          <Card className="p-6">
            <Pipeline
              stages={data.statusSummary.map((s) => ({
                key: s.status,
                label: label(s.status),
                value: s.orders,
                prev: s.prev,
                color: statusColor[s.status] ?? VIZ.muted,
                href: `/panel/orders?status=${s.status}`,
              }))}
            />
          </Card>
        </Section>
      )}

      {canOrders && (
        <Section title="Today">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile label="Today's sales" value={inr(today.sales)} prev={yesterday.sales} icon={<Icon name="rupee" size={16} />} tone="brand" />
            <MetricTile label="Today's orders" value={String(today.orders)} prev={yesterday.orders} icon={<Icon name="shopping-bag" size={16} />} tone="blue" />
            {canCustomers && (
              <MetricTile label="Today's signups" value={String(customers.today)} prev={customers.yesterday} icon={<Icon name="users" size={16} />} tone="violet" />
            )}
            <MetricTile label="Pending to ship" value={String(data.fulfillment.queued)} icon={<Icon name="clock" size={16} />} tone="amber" invert href="/panel/orders?synced=0" />
          </div>
        </Section>
      )}

      {canCustomers && (
        <Section title="Customers">
          <div className="grid gap-5 lg:grid-cols-3">
            <Card className="p-6">
              <h3 className="mb-5 font-bold text-ink">Who&apos;s buying</h3>
              <dl className="space-y-4 text-sm">
                {[
                  { k: "Total customers", v: customers.total },
                  { k: "Verified", v: customers.verified },
                  { k: "Unverified", v: customers.unverified },
                  { k: "Repeat buyers", v: customers.repeat },
                  { k: `New in ${data.days} days`, v: customers.newInPeriod },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between">
                    <dt className="text-muted">{r.k}</dt>
                    <dd className="font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>{r.v}</dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="mb-5 font-bold text-ink">Carts &amp; wishlist</h3>
              <BarList
                data={[
                  { label: "Live carts", value: carts.active, color: VIZ.series1 },
                  { label: "Abandoned", value: carts.abandoned, color: VIZ.warning },
                  { label: "Converted", value: carts.converted, color: VIZ.good },
                  { label: "Wishlist items", value: data.wishlistItems, color: VIZ.series2 },
                ]}
                emptyLabel="No cart activity yet"
              />
            </Card>

            <Card className="p-6">
              <h3 className="mb-5 font-bold text-ink">Key rates</h3>
              <dl className="space-y-4 text-sm">
                {[
                  { k: "Prepaid share", v: `${insights.prepaidRatio}%` },
                  { k: "Collected of sales", v: `${insights.collectedRate}%` },
                  { k: "Verified customers", v: `${insights.verifiedRate}%` },
                  { k: "Repeat customers", v: `${insights.repeatRate}%` },
                  { k: "Cancellation rate", v: `${insights.cancelRate}%` },
                ].map((r) => (
                  <div key={r.k} className="flex items-center justify-between">
                    <dt className="text-muted">{r.k}</dt>
                    <dd className="font-bold text-ink">{r.v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </Section>
      )}

      {canOrders && (
        <Section title="What's selling" hint={`Last ${data.days} days`}>
          <div className="grid gap-5 lg:grid-cols-3">
            {canProducts && (
              <Card className="p-6">
                <h3 className="mb-5 font-bold text-ink">Top products</h3>
                <BarList
                  data={data.topProducts.map((p) => ({
                    label: p.name, value: p.revenue, color: VIZ.series1, hint: `${p.units} units sold`,
                  }))}
                  format={inr}
                  emptyLabel="No sales in this period"
                />
              </Card>
            )}
            <Card className="p-6">
              <h3 className="mb-5 font-bold text-ink">Top states</h3>
              <BarList
                data={data.topStates.map((s) => ({ label: s.name, value: s.revenue, color: VIZ.series2 }))}
                format={inr}
                emptyLabel="No orders in this period"
              />
            </Card>
            <Card className="p-6">
              <h3 className="mb-5 font-bold text-ink">Fulfillment</h3>
              <BarList
                data={[
                  { label: "Pushed to EasyEcom", value: data.fulfillment.pushed, color: VIZ.good },
                  { label: "Waiting in queue", value: data.fulfillment.queued, color: VIZ.warning },
                  { label: "Failing", value: data.fulfillment.failing, color: VIZ.critical },
                ]}
                emptyLabel="No orders yet"
              />
              {canProducts && (
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5 text-sm">
                  <div>
                    <div className="text-xs text-muted">Low stock</div>
                    <div className="font-bold text-ink">{data.lowStock.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Out of stock</div>
                    <div className="font-bold text-ink">{data.outOfStock}</div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </Section>
      )}

      {canOrders && (
        <Section title="Recent orders">
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-end">
              <Link href="/panel/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                View all orders <Icon name="chevron" size={14} />
              </Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-soft text-slate-400">
                  <Icon name="shopping-bag" size={22} />
                </div>
                <p className="mt-3 text-sm text-muted">Orders placed on the website will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                      <th className="py-3 pr-3">Order</th>
                      <th className="py-3 pr-3">Customer</th>
                      <th className="py-3 pr-3">Payment</th>
                      <th className="py-3 pr-3 text-right">Total</th>
                      <th className="py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => {
                      const type = paymentTypeOf(o);
                      return (
                        <tr key={String(o.id)} className="border-b border-line/60 last:border-0 hover:bg-soft/60">
                          <td className="py-3 pr-3">
                            <Link href={`/panel/orders/${o.id}`} className="font-mono text-xs font-semibold text-brand hover:underline">
                              {String(o.orderNumber ?? o.id)}
                            </Link>
                          </td>
                          <td className="py-3 pr-3">
                            <div className="text-ink">{String(o.customerName ?? "-")}</div>
                            <div className="text-xs text-muted">{String(o.customerMobile ?? "")}</div>
                          </td>
                          <td className="py-3 pr-3">
                            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                              <span className="h-2 w-2 rounded-full" style={{ background: paymentColor[type] }} aria-hidden />
                              {PAYMENT_TYPES.find((t) => t.value === type)?.label}
                            </span>
                          </td>
                          <td className="py-3 pr-3 text-right font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                            {inr(Number(o.total ?? 0))}
                          </td>
                          <td className="py-3">
                            <Badge tone={statusTone[String(o.status)] ?? "neutral"}>
                              {label(String(o.status ?? "pending"))}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Section>
      )}

      {data.lowStock.length > 0 && (
        <Section title="Needs attention">
          <Card className="border-amber-200 bg-amber-50/40 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <Icon name="alert" size={18} className="text-amber-500" /> Low stock
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.lowStock.map((p) => (
                <Link
                  key={String(p.id)}
                  href={`/panel/products/${p.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm hover:bg-amber-100"
                >
                  {String(p.name)} <Badge tone="red">{String(p.stock)} left</Badge>
                </Link>
              ))}
            </div>
          </Card>
        </Section>
      )}

      {catalog.length > 0 && (
        <Section title="Manage">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.map((c) => (
              <Link
                key={c.key}
                href={c.href}
                className="flex min-h-[56px] items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 transition-colors hover:border-brand/30 hover:bg-mint"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-soft text-brand">
                  <Icon name={c.icon} size={16} />
                </span>
                <span className="text-sm font-medium text-ink">{c.label}</span>
                <span className="ml-auto text-sm font-bold text-brand">{data.counts[c.key] ?? 0}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}
      <div className="h-8" />
    </div>
  );
}
