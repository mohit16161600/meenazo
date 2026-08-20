"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { apiGet } from "@/app/panel/_lib/api";
import { Badge, Button, Card, ErrorState, LoadingBlock } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { MetricTile } from "@/app/panel/_components/charts";
import { formatPrice } from "@/utils/format";
import { fmtDate, fmtTime, fmtDateTime, fmtRelative } from "@/app/panel/_lib/datetime";

/**
 * Customer 360 — one page per number.
 * ---------------------------------------------------------------------------
 * "Number is primary": everything this person has ever done is keyed to their
 * phone, so this page is keyed to it too. It answers, in one screen and without
 * a single further click: who they are, what they've bought, what they walked
 * away from, what's sitting in their cart and wishlist right now, and every
 * login/OTP/action in order.
 *
 * It replaces the slide-over panel on the list page — a slide-over can't be
 * bookmarked, shared with support, or opened in a second tab next to an order.
 */

interface OrderRow {
  id: string;
  orderNumber: string;
  items: unknown[];
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  status: string;
  city: string | null;
  state: string | null;
  createdAt: string | null;
}
interface WishRow { slug: string | null; name: string | null; createdAt: string | null }
interface AbandonedRow {
  id: number;
  stage: string;
  itemCount: number;
  value: number;
  orderNumber: string | null;
  abandonedAt: string | null;
  recovered: boolean;
  recoveredOrderNumber: string | null;
}
interface ActivityRow {
  id: number;
  action: string;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string | null;
}
interface OtpRow {
  code: string; channel: string; purpose: string | null;
  consumed: boolean; expiresAt: string | null; createdAt: string | null;
}
interface Detail {
  found: boolean;
  phone: string;
  customer: {
    phone: string; name: string | null; email: string | null;
    verified: boolean; lastLoginAt: string | null; ip: string | null; createdAt: string | null;
  } | null;
  stats: {
    ordersCount: number; totalSpent: number; wishlistCount: number;
    deliveredCount: number; cancelledCount: number;
    abandonedCount: number; abandonedValue: number; recoveredCount: number;
    firstOrderAt: string | null; lastOrderAt: string | null; aov: number;
  };
  orders: OrderRow[];
  wishlist: WishRow[];
  cart: { itemCount: number; subtotal: number; status: string; couponCode: string | null; lastActivityAt: string | null } | null;
  abandonedCarts: AbandonedRow[];
  otps: OtpRow[];
  activity: ActivityRow[];
}

const ACTIVITY_LABEL: Record<string, string> = {
  login: "Logged in",
  register: "Account created",
  otp_requested: "OTP requested",
  otp_verified: "OTP verified",
  wishlist_add: "Added to wishlist",
  wishlist_remove: "Removed from wishlist",
  cart_save: "Cart saved",
  order_placed: "Order placed",
  profile_update: "Profile updated",
};

const statusTone = (s: string): "green" | "amber" | "red" | "blue" | "neutral" => {
  const v = s.toLowerCase();
  if (v === "delivered") return "green";
  if (v === "cancelled" || v === "returned" || v === "ndr") return "red";
  if (v === "pending") return "amber";
  if (v === "confirmed" || v === "processing" || v === "shipped") return "blue";
  return "neutral";
};

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: string;
  title: string;
  count?: number | string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Icon name={icon} size={14} className="text-brand" />
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</h2>
        </div>
        {count !== undefined && <span className="text-[11px] font-semibold text-muted">{count}</span>}
      </div>
      {children}
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-center text-[13px] text-muted">{children}</p>;
}

export default function CustomerPage() {
  const { phone } = useParams<{ phone: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return apiGet<Detail>(`/customers?phone=${encodeURIComponent(phone)}`)
      .then(setData)
      .catch((e) => setError((e as { message?: string }).message ?? "Could not load this customer."))
      .finally(() => setLoading(false));
  }, [phone]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) return <LoadingBlock label="Loading customer…" />;
  if (error)
    return (
      <Card>
        <ErrorState title="Customer couldn't load" message={error} onRetry={load} />
      </Card>
    );
  if (!data) return null;

  const c = data.customer;
  const s = data.stats;
  const wa = `https://wa.me/91${String(data.phone).replace(/\D/g, "").slice(-10)}`;
  const tel = `tel:+91${String(data.phone).replace(/\D/g, "").slice(-10)}`;

  return (
    <div className="space-y-4">
      {/* ------------------------------ Header ------------------------------ */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-4 py-3">
          <div className="min-w-0">
            <Link
              href="/panel/customers"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-muted hover:text-brand"
            >
              <Icon name="chevron" size={12} className="rotate-180" /> Customers
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-[20px] font-extrabold tracking-tight text-ink">{data.phone}</h1>
              {c?.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Unverified</Badge>}
              {s.ordersCount >= 2 ? (
                <Badge tone="green">Repeat buyer</Badge>
              ) : s.ordersCount === 1 ? (
                <Badge tone="blue">Buyer</Badge>
              ) : (
                <Badge tone="neutral">Never ordered</Badge>
              )}
              {!data.found && <Badge tone="red">No account</Badge>}
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-muted">
              <span className="font-semibold text-ink">{c?.name || "No name"}</span>
              {c?.email && (
                <>
                  <span>·</span>
                  <span>{c.email}</span>
                </>
              )}
              <span>·</span>
              <span>Joined {fmtDate(c?.createdAt)}</span>
              <span>·</span>
              <span>Last seen {fmtRelative(c?.lastLoginAt) || "—"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href={tel} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-soft">
              <Icon name="phone" size={15} /> Call
            </a>
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:border-brand/40 hover:bg-mint">
              <Icon name="message" size={15} /> WhatsApp
            </a>
            <Link href={`/panel/orders?q=${encodeURIComponent(data.phone)}`} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:border-brand/40 hover:bg-mint">
              <Icon name="shopping-bag" size={15} /> Their orders
            </Link>
            <Button variant="outline" icon="refresh" onClick={load} loading={loading}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* ------------------------------- Tiles ------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <MetricTile label="Orders" value={String(s.ordersCount)} icon={<Icon name="shopping-bag" size={16} />} tone="blue" />
        <MetricTile label="Total spent" value={formatPrice(s.totalSpent)} icon={<Icon name="rupee" size={16} />} tone="brand" />
        <MetricTile label="Average order" value={formatPrice(s.aov)} icon={<Icon name="activity" size={16} />} tone="violet" />
        <MetricTile label="Delivered" value={String(s.deliveredCount)} icon={<Icon name="check" size={16} />} tone="brand" />
        <MetricTile label="Cancelled" value={String(s.cancelledCount)} icon={<Icon name="x" size={16} />} tone="red" invert />
        <MetricTile
          label="Abandoned (open)"
          value={`${s.abandonedCount}`}
          icon={<Icon name="clock" size={16} />}
          tone="amber"
          invert
        />
      </div>

      {s.abandonedCount > 0 && (
        <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-[12.5px] font-semibold leading-snug text-amber-800 ring-1 ring-amber-200">
          {formatPrice(s.abandonedValue)} is sitting in {s.abandonedCount} abandoned cart
          {s.abandonedCount === 1 ? "" : "s"} for this number — see the list below, then reach out on WhatsApp.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {/* ----------------------------- Orders ---------------------------- */}
          <Section icon="shopping-bag" title="Orders" count={`${data.orders.length} total`}>
            {data.orders.length === 0 ? (
              <Empty>This number has never placed an order.</Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                      <th className="px-4 py-2 text-left font-semibold">Order</th>
                      <th className="px-3 py-2 text-left font-semibold">Placed</th>
                      <th className="px-3 py-2 text-left font-semibold">Items</th>
                      <th className="px-3 py-2 text-left font-semibold">Payment</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-4 py-2 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-soft/60">
                        <td className="px-4 py-2.5">
                          <Link href={`/panel/orders/${o.id}`} className="font-mono text-[12px] font-bold text-brand hover:underline">
                            {o.orderNumber}
                          </Link>
                          {o.couponCode && <div className="text-[11px] font-semibold text-gold">{o.couponCode}</div>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5">
                          <div className="tabular-nums text-ink">{fmtDate(o.createdAt)}</div>
                          <div className="text-[11px] tabular-nums text-muted">{fmtTime(o.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2.5 text-muted">{o.items.length} line(s)</td>
                        <td className="px-3 py-2.5 capitalize text-muted">{o.paymentMethod || "—"}</td>
                        <td className="px-3 py-2.5 text-right font-bold tabular-nums text-ink">{formatPrice(o.total)}</td>
                        <td className="px-4 py-2.5">
                          <Badge tone={statusTone(o.status)}>{o.status || "—"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          {/* ------------------------- Abandoned carts ----------------------- */}
          <Section icon="clock" title="Abandoned carts & checkouts" count={`${data.abandonedCarts.length} logged`}>
            {data.abandonedCarts.length === 0 ? (
              <Empty>Nothing abandoned — every cart this number started was either finished or is still active.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {data.abandonedCarts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.recovered ? (
                          <Badge tone="green">Recovered</Badge>
                        ) : a.stage === "payment" ? (
                          <Badge tone="red">Payment not completed</Badge>
                        ) : (
                          <Badge tone="amber">Cart only</Badge>
                        )}
                        {a.orderNumber && <span className="font-mono text-[12px] text-muted">{a.orderNumber}</span>}
                        {a.recoveredOrderNumber && (
                          <span className="font-mono text-[12px] text-brand">→ {a.recoveredOrderNumber}</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-muted">
                        {a.itemCount} item{a.itemCount === 1 ? "" : "s"} · {fmtDateTime(a.abandonedAt)} ·{" "}
                        {fmtRelative(a.abandonedAt)}
                      </div>
                    </div>
                    <span className={`text-[14px] font-bold tabular-nums ${a.recovered ? "text-muted line-through" : "text-amber-700"}`}>
                      {formatPrice(a.value)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* ---------------------------- Activity --------------------------- */}
          <Section icon="activity" title="Activity trail" count={`${data.activity.length} events`}>
            {data.activity.length === 0 ? (
              <Empty>No activity recorded yet.</Empty>
            ) : (
              <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
                {data.activity.map((a) => (
                  <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2">
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-ink">
                        {ACTIVITY_LABEL[a.action] ?? a.action.replace(/_/g, " ")}
                      </span>
                      {a.ip && <span className="ml-2 font-mono text-[11px] text-muted">{a.ip}</span>}
                    </div>
                    <span className="flex-none text-right text-[11px] tabular-nums text-muted">
                      {fmtDateTime(a.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          {/* ------------------------------ Cart ----------------------------- */}
          <Section icon="shopping-bag" title="Cart right now">
            {!data.cart || data.cart.itemCount === 0 ? (
              <Empty>Cart is empty.</Empty>
            ) : (
              <div className="divide-y divide-line">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-[12px] text-muted">Items</span>
                  <span className="text-[13px] font-bold text-ink">{data.cart.itemCount}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-[12px] text-muted">Value</span>
                  <span className="text-[13px] font-bold text-ink">{formatPrice(data.cart.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-[12px] text-muted">Status</span>
                  <Badge tone={data.cart.status === "active" ? "green" : "amber"}>{data.cart.status}</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-[12px] text-muted">Last touched</span>
                  <span className="text-[12px] text-ink">{fmtRelative(data.cart.lastActivityAt) || "—"}</span>
                </div>
              </div>
            )}
          </Section>

          {/* ---------------------------- Wishlist --------------------------- */}
          <Section icon="star" title="Wishlist" count={data.wishlist.length}>
            {data.wishlist.length === 0 ? (
              <Empty>Nothing saved.</Empty>
            ) : (
              <ul className="divide-y divide-line">
                {data.wishlist.map((w, i) => (
                  <li key={`${w.slug}-${i}`} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="min-w-0 truncate text-[13px] text-ink">{w.name || w.slug}</span>
                    <span className="flex-none text-[11px] text-muted">{fmtDate(w.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* --------------------------- Identity ---------------------------- */}
          <Section icon="shield-check" title="Account">
            <div className="divide-y divide-line">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[12px] text-muted">First order</span>
                <span className="text-[12.5px] text-ink">{fmtDate(s.firstOrderAt)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[12px] text-muted">Last order</span>
                <span className="text-[12.5px] text-ink">{fmtDate(s.lastOrderAt)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[12px] text-muted">Recovered carts</span>
                <span className="text-[12.5px] text-ink">{s.recoveredCount}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[12px] text-muted">Signup IP</span>
                <span className="font-mono text-[11.5px] text-ink">{c?.ip || "—"}</span>
              </div>
            </div>
          </Section>

          {/* ------------------------------ OTPs ----------------------------- */}
          <Section icon="shield-check" title="OTP log" count={data.otps.length}>
            {data.otps.length === 0 ? (
              <Empty>No OTPs sent.</Empty>
            ) : (
              <ul className="max-h-[260px] divide-y divide-line overflow-y-auto">
                {data.otps.map((o, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]">
                    <span className="font-mono font-bold text-ink">{o.code}</span>
                    <span className="text-muted">
                      {o.channel}
                      {o.consumed ? " · used" : " · unused"}
                    </span>
                    <span className="flex-none tabular-nums text-muted">{fmtDateTime(o.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
      <div className="h-6" />
    </div>
  );
}
