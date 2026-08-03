"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet } from "../../_lib/api";
import { Badge, Button, PageHeader, TableSkeleton } from "../../_components/ui";
import { Icon } from "../../_components/Icon";
import { MetricTile, inr } from "../../_components/charts";
import { formatPrice } from "@/utils/format";

interface CustomerListRow {
  phone: string;
  name: string | null;
  email: string | null;
  verified: boolean;
  ordersCount: number;
  totalSpent: number;
  lastLoginAt: string | null;
  createdAt: string | null;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  items: { name?: string; quantity?: number; variant?: string }[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string | null;
}
interface WishRow {
  productId: string;
  slug: string | null;
  name: string | null;
  createdAt: string | null;
}
interface OtpRow {
  code: string;
  channel: string;
  consumed: boolean;
  createdAt: string | null;
}
interface Cart360 {
  items: { name?: string; quantity?: number; variant?: string }[];
  itemCount: number;
  subtotal: number;
  status: string;
  lastActivityAt: string | null;
}
interface Detail {
  found: boolean;
  phone: string;
  customer: {
    phone: string;
    name: string | null;
    email: string | null;
    password: string | null;
    verified: boolean;
    lastLoginAt: string | null;
    createdAt: string | null;
  } | null;
  stats: { ordersCount: number; totalSpent: number; wishlistCount: number };
  orders: OrderRow[];
  wishlist: WishRow[];
  cart: Cart360 | null;
  abandoned: Cart360 | null;
  otps: OtpRow[];
}

const fmtDate = (s: string | null) => (s ? String(s).slice(0, 16).replace("T", " ") : " - ");

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<CustomerListRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "verified" | "unverified" | "buyers">("all");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const summary = useMemo(
    () => ({
      verified: list.filter((c) => c.verified).length,
      buyers: list.filter((c) => c.ordersCount > 0).length,
      spent: list.reduce((n, c) => n + Number(c.totalSpent ?? 0), 0),
    }),
    [list]
  );

  const filtered = useMemo(() => {
    if (tab === "verified") return list.filter((c) => c.verified);
    if (tab === "unverified") return list.filter((c) => !c.verified);
    if (tab === "buyers") return list.filter((c) => c.ordersCount > 0);
    return list;
  }, [list, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  /** Export the customers currently in view, with a BOM so Excel keeps ₹ and Hindi names. */
  function exportCsv() {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((c) =>
      [c.phone, c.name ?? "", c.email ?? "", c.verified ? "Verified" : "Unverified",
       c.ordersCount, c.totalSpent, c.createdAt ?? "", c.lastLoginAt ?? ""].map(esc).join(",")
    );
    const url = URL.createObjectURL(
      new Blob(["﻿" + ["Phone,Name,Email,Status,Orders,Spent,Joined,Last login", ...rows].join("\n")], {
        type: "text/csv;charset=utf-8;",
      })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `meenazo-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const loadList = useCallback(async (query?: string) => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await apiGet<{ customers: CustomerListRow[] }>(
        `/customers${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      setList(res.customers ?? []);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Could not load customers.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadDetail = useCallback(async (phone: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await apiGet<Detail>(`/customers?phone=${encodeURIComponent(phone)}`);
      setDetail(res);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Could not load customer.");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = q.replace(/\D/g, "");
    // A full 10-digit number → jump straight to the 360; otherwise filter the list.
    if (digits.length >= 10) loadDetail(digits.slice(-10));
    else loadList(q.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Search by mobile number for a customer's full history - orders, wishlist, cart and OTP log."
        actions={
          !detail ? (
            <Button variant="outline" icon="upload" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
          ) : undefined
        }
      />

      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter mobile number (or name / email)…"
          aria-label="Search customers"
          className="min-h-[44px] w-full max-w-md rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Search
        </button>
        {detail && (
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Icon name="chevron" size={14} className="rotate-180" /> Back to list
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* -------- 360 view -------- */}
      {detail ? (
        loadingDetail ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !detail.found ? (
          <div className="rounded-xl border border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">No customer found for {detail.phone}</p>
            <p className="mt-1 text-sm text-muted">No account, orders, wishlist or activity for this number yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile + stats */}
            <div className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-ink">{detail.customer?.name || "Guest"}</h2>
                    {detail.customer?.verified ? (
                      <Badge tone="green">Verified</Badge>
                    ) : (
                      <Badge tone="neutral">Unverified</Badge>
                    )}
                    {detail.abandoned && <Badge tone="amber">Abandoned cart</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-sm text-ink">📱 {detail.phone}</p>
                  {detail.customer?.email && <p className="text-sm text-muted">✉️ {detail.customer.email}</p>}
                  {detail.customer?.password && (
                    <p className="text-xs text-muted">
                      Password: <code className="rounded bg-soft px-1.5 py-0.5">{detail.customer.password}</code>
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    Joined {fmtDate(detail.customer?.createdAt ?? null)} · Last login {fmtDate(detail.customer?.lastLoginAt ?? null)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Stat label="Orders" value={String(detail.stats.ordersCount)} />
                  <Stat label="Spent" value={formatPrice(detail.stats.totalSpent)} />
                  <Stat label="Wishlist" value={String(detail.stats.wishlistCount)} />
                </div>
              </div>
            </div>

            {/* Orders */}
            <Section title={`Orders (${detail.orders.length})`} icon="shopping-bag">
              {detail.orders.length === 0 ? (
                <Empty>No orders yet.</Empty>
              ) : (
                <div className="divide-y divide-line">
                  {detail.orders.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                      <div className="min-w-0">
                        <span className="font-semibold text-ink">{o.orderNumber}</span>
                        <span className="ml-2 text-xs text-muted">{fmtDate(o.createdAt)}</span>
                        <p className="truncate text-xs text-muted">
                          {o.items.map((it) => `${it.name ?? "?"}${it.variant ? ` (${it.variant})` : ""} ×${it.quantity ?? 1}`).join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted">{o.paymentMethod}</span>
                        <Badge tone={o.status === "cancelled" ? "red" : o.status === "pending" ? "amber" : "green"}>{o.status}</Badge>
                        <span className="font-bold tabular-nums">{formatPrice(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Cart / abandoned */}
            <Section title="Current cart" icon="shopping-bag">
              {!detail.cart || detail.cart.itemCount === 0 ? (
                <Empty>Cart is empty.</Empty>
              ) : (
                <div>
                  <p className="mb-2 text-sm">
                    <Badge tone={detail.cart.status === "active" ? "amber" : "green"}>{detail.cart.status}</Badge>{" "}
                    <span className="text-muted">Last activity {fmtDate(detail.cart.lastActivityAt)}</span>
                  </p>
                  <p className="text-sm text-ink">
                    {detail.cart.items.map((it) => `${it.name ?? "?"} ×${it.quantity ?? 1}`).join(", ")}
                  </p>
                  <p className="mt-1 text-sm font-semibold">Subtotal: {formatPrice(detail.cart.subtotal)}</p>
                </div>
              )}
            </Section>

            {/* Wishlist */}
            <Section title={`Wishlist (${detail.wishlist.length})`} icon="heart-pulse">
              {detail.wishlist.length === 0 ? (
                <Empty>Nothing saved.</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {detail.wishlist.map((w) => (
                    <li key={w.productId} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink">{w.name ?? w.slug ?? w.productId}</span>
                      <span className="text-xs text-muted">{fmtDate(w.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* OTP log */}
            <Section title="OTP log" icon="shield-check">
              {detail.otps.length === 0 ? (
                <Empty>No OTPs issued.</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {detail.otps.map((o, i) => (
                    <li key={i} className="flex items-center justify-between py-2 text-sm">
                      <span className="font-mono font-bold text-ink">{o.code}</span>
                      <span className="text-xs text-muted">
                        {o.channel} · {o.consumed ? "used" : "unused"} · {fmtDate(o.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        )
      ) : (
        /* -------- customer list -------- */
        <div>
          <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile label="Customers" value={String(list.length)} icon={<Icon name="users" size={16} />} tone="brand" />
            <MetricTile label="Verified" value={String(summary.verified)} icon={<Icon name="check" size={16} />} tone="blue" />
            <MetricTile label="Have ordered" value={String(summary.buyers)} icon={<Icon name="shopping-bag" size={16} />} tone="violet" />
            <MetricTile label="Lifetime value" value={inr(summary.spent)} icon={<Icon name="rupee" size={16} />} tone="amber" />
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-line p-3">
              {([
                { key: "all", label: "All", count: list.length },
                { key: "verified", label: "Verified", count: summary.verified },
                { key: "unverified", label: "Unverified", count: list.length - summary.verified },
                { key: "buyers", label: "Have ordered", count: summary.buyers },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => { setTab(t.key); setPage(1); }}
                  aria-pressed={tab === t.key}
                  className={
                    "inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
                    (tab === t.key ? "bg-brand text-white" : "text-muted hover:bg-soft hover:text-ink")
                  }
                >
                  {t.label}
                  <span className={"rounded-full px-1.5 text-[11px] font-bold " + (tab === t.key ? "bg-white/25" : "bg-soft")}>
                    {t.count}
                  </span>
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs text-muted">
                Show
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  aria-label="Rows per page"
                  className="min-h-[44px] rounded-xl border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                >
                  {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} per page</option>)}
                </select>
              </label>
            </div>

            {loadingList ? (
              <TableSkeleton rows={6} cols={5} />
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand">
                  <Icon name="users" size={26} />
                </div>
                <p className="mt-4 font-semibold text-ink">
                  {tab === "all" ? "No customers yet" : "Nobody in this group"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  {tab === "all"
                    ? "Customers appear here as soon as someone signs up on the website."
                    : "Switch back to the All tab to see everyone."}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line bg-soft/70 text-left text-[11px] uppercase tracking-wide text-muted">
                        <th className="px-4 py-3 font-semibold">Number</th>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Orders</th>
                        <th className="px-4 py-3 text-right font-semibold">Spent</th>
                        <th className="px-4 py-3 font-semibold">Joined</th>
                        <th className="px-4 py-3 font-semibold">Last login</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((c) => (
                        <tr key={c.phone} className="border-b border-line/60 last:border-0 hover:bg-soft/70">
                          <td className="px-4 py-3 font-mono font-semibold text-ink">{c.phone}</td>
                          <td className="px-4 py-3 text-ink">{c.name || "-"}</td>
                          <td className="px-4 py-3 text-xs text-muted">{c.email || "-"}</td>
                          <td className="px-4 py-3">
                            {c.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="neutral">Unverified</Badge>}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{c.ordersCount}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(c.totalSpent)}</td>
                          <td className="px-4 py-3 text-xs text-muted">{fmtDate(c.createdAt)}</td>
                          <td className="px-4 py-3 text-xs text-muted">{fmtDate(c.lastLoginAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => loadDetail(c.phone)}
                              className="inline-flex min-h-[38px] items-center rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-brand hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            >
                              View history
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
                  <span className="text-xs text-muted" aria-live="polite">
                    Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </span>
                  {pageCount > 1 && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        Previous
                      </button>
                      <span className="px-2 text-sm text-muted">Page {page} of {pageCount}</span>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={page === pageCount}
                        className="inline-flex h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <h3 className="mb-3 flex items-center gap-2 font-bold text-ink">
        <Icon name={icon} size={18} className="text-brand" />
        {title}
      </h3>
      {children}
    </div>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-soft px-4 py-2 text-center">
      <div className="text-lg font-extrabold tabular-nums text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
