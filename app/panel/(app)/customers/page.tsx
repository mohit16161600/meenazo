"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../../_lib/api";
import { Badge } from "../../_components/ui";
import { Icon } from "../../_components/Icon";
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

const fmtDate = (s: string | null) => (s ? String(s).slice(0, 16).replace("T", " ") : "—");

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<CustomerListRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div>
        <h1 className="text-2xl font-bold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Search by mobile number for a customer&apos;s full history — orders, wishlist, cart &amp; OTP log.
        </p>
      </div>

      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter mobile number (or name / email)…"
          className="w-full max-w-md rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Search
        </button>
        {detail && (
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-ink hover:bg-soft"
          >
            Back to list
          </button>
        )}
      </form>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* -------- 360 view -------- */}
      {detail ? (
        loadingDetail ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : !detail.found ? (
          <div className="rounded-brand border border-line bg-white p-8 text-center">
            <p className="font-semibold text-ink">No customer found for {detail.phone}</p>
            <p className="mt-1 text-sm text-muted">No account, orders, wishlist or activity for this number yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Profile + stats */}
            <div className="rounded-brand border border-line bg-white p-5">
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
        /* -------- recent customers list -------- */
        <div className="rounded-brand border border-line bg-white">
          {loadingList ? (
            <p className="p-6 text-sm text-muted">Loading…</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-sm text-muted">No customers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Number</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Spent</th>
                    <th className="px-4 py-3">Last login</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.phone} className="border-b border-line last:border-0 hover:bg-soft">
                      <td className="px-4 py-3 font-mono font-semibold text-ink">{c.phone}</td>
                      <td className="px-4 py-3">
                        {c.name || "—"} {c.verified && <span title="Verified">✅</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{c.ordersCount}</td>
                      <td className="px-4 py-3 tabular-nums">{formatPrice(c.totalSpent)}</td>
                      <td className="px-4 py-3 text-xs text-muted">{fmtDate(c.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => loadDetail(c.phone)}
                          className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-brand hover:bg-mint"
                        >
                          View history
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-brand border border-line bg-white p-5">
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
    <div className="rounded-lg bg-soft px-4 py-2 text-center">
      <div className="text-lg font-extrabold tabular-nums text-ink">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}
