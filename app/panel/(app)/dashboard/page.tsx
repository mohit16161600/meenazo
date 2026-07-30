"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, LoadingBlock, PageHeader } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import { useToast } from "@/app/panel/_components/toast";
import { NAV } from "@/app/panel/_lib/specs";
import { canAccess } from "@/lib/panelRoles";

interface DashboardData {
  role: string;
  counts: Record<string, number>;
  revenue: number;
  pendingOrders: number;
  recentOrders: Record<string, unknown>[];
  lowStock: Record<string, unknown>[];
}

const resourceOf = (path: string) => path.split("/")[2] ?? "dashboard";

const money = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

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

interface DispatchReport {
  configured: boolean;
  pushed: number;
  failed: number;
  scanned: number;
  skipped: number;
}

export default function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    apiGet<DashboardData & { success: boolean }>("/dashboard")
      .then((d) => setData(d))
      .catch((e: ApiError) => setError(e.message));
  }, []);

  async function runDispatch() {
    setDispatching(true);
    try {
      // Not under /api/panel — hit the shared dispatch route directly (?force=1
      // ignores the 3h hold). Authorized by the admin session cookie.
      const res = await fetch("/api/easyecom/dispatch?force=1", {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string; report?: DispatchReport };
      if (!res.ok || json.success === false) {
        throw new Error(json.message || `Dispatch failed (${res.status})`);
      }
      const r = json.report;
      if (r && !r.configured) {
        toast.push("error", "EasyEcom is not configured yet — set EASYECOM_API_URL and EASYECOM_API_TOKEN.");
      } else if (r) {
        toast.push("success", `EasyEcom: ${r.pushed} pushed, ${r.failed} failed (${r.scanned} scanned).`);
      } else {
        toast.push("success", "Dispatch triggered.");
      }
    } catch (e) {
      toast.push("error", (e as Error).message ?? "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  }

  if (error)
    return (
      <Card className="p-6">
        <p className="text-red-600">Could not load dashboard: {error}</p>
      </Card>
    );
  if (!data) return <LoadingBlock label="Loading dashboard…" />;

  // Confidential business sections (orders, revenue, customers) are only shown
  // to roles that can access them — content roles get a content-only dashboard.
  const role = data.role;
  const canOrders = canAccess(role, "orders");
  const canProducts = canAccess(role, "products");

  const stats = [
    ...(canProducts
      ? [{ label: "Products", value: String(data.counts.products ?? 0), icon: "box", chip: "bg-mint text-brand", href: "/panel/products" }]
      : []),
    ...(canOrders
      ? [
          { label: "Orders", value: String(data.counts.orders ?? 0), icon: "shopping-bag", chip: "bg-sky-50 text-sky-600", href: "/panel/orders" },
          { label: "Revenue", value: money(data.revenue), icon: "rupee", chip: "bg-amber-50 text-amber-600", href: "/panel/orders" },
          { label: "Pending orders", value: String(data.pendingOrders ?? 0), icon: "clock", chip: "bg-red-50 text-red-600", href: "/panel/orders" },
        ]
      : []),
  ];

  const catalog = [
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
        subtitle="Overview of your Meenazo store"
        actions={
          canOrders ? (
            <Button variant="outline" icon="upload" onClick={runDispatch} loading={dispatching}>
              Send due orders to EasyEcom
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-5 transition-shadow hover:shadow-brand">
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.chip}`}>
                  <Icon name={s.icon} size={20} />
                </div>
                <Icon name="chevron" size={16} className="text-slate-300" />
              </div>
              <div className="mt-3 text-2xl font-bold text-ink">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {canOrders && (
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-ink">Recent orders</h2>
            <Link href="/panel/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              View all <Icon name="chevron" size={14} />
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-slate-400">
                <Icon name="shopping-bag" size={22} />
              </div>
              <p className="mt-3 text-sm text-muted">No orders yet. New COD orders will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3">Order</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={String(o.id)} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-xs">{String(o.orderNumber ?? o.id)}</td>
                      <td className="py-2.5 pr-3">{String(o.customerName ?? "—")}</td>
                      <td className="py-2.5 pr-3 font-semibold">{money(Number(o.total))}</td>
                      <td className="py-2.5">
                        <Badge tone={statusTone[String(o.status)] ?? "neutral"}>
                          {String(o.status ?? "pending").replace(/_/g, " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        )}

        <Card className={canOrders ? "p-5" : "p-5 lg:col-span-3"}>
          <h2 className="mb-3 font-bold text-ink">Catalog</h2>
          <div className="space-y-1">
            {catalog.map((c) => (
              <Link
                key={c.key}
                href={c.href}
                className="flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-soft"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-soft text-slate-500">
                  <Icon name={c.icon} size={16} />
                </span>
                <span className="text-sm text-ink">{c.label}</span>
                <span className="ml-auto text-sm font-bold text-brand">{data.counts[c.key] ?? 0}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {data.lowStock.length > 0 && (
        <Card className="mt-6 border-amber-200 bg-amber-50/40 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
            <Icon name="alert" size={18} className="text-amber-500" /> Low stock
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.lowStock.map((p) => (
              <Link
                key={String(p.id)}
                href={`/panel/products/${p.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm hover:bg-amber-100"
              >
                {String(p.name)} <Badge tone="red">{String(p.stock)} left</Badge>
              </Link>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {NAV.filter(
          (n) => n.href !== "/panel/dashboard" && canAccess(role, resourceOf(n.href))
        ).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-brand/30 hover:bg-mint"
          >
            <Icon name={n.icon} size={16} className="text-brand" /> {n.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
