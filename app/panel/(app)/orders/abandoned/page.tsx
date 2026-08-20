"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "../../../_lib/api";
import { Badge, Button, PageHeader, TableSkeleton } from "../../../_components/ui";
import { Icon } from "../../../_components/Icon";
import { MetricTile } from "../../../_components/charts";
import { formatPrice } from "@/utils/format";

/** One line of the cart/order as it looked when the customer walked away. */
interface AbandonedItem {
  name?: string;
  variant?: string | null;
  quantity?: number;
  price?: number;
}

/** One abandonment event — a cold cart, or a payment that was never finished. */
interface AbandonedRow {
  id: string;
  phone: string;
  customerName: string | null;
  customerEmail: string | null;
  stage: string;
  items: AbandonedItem[];
  itemCount: number;
  subtotal: number;
  value: number;
  couponCode: string | null;
  orderId: string | null;
  orderNumber: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  paymentMethod: string | null;
  source: string | null;
  ip: string | null;
  lastActivityAt: string | null;
  abandonedAt: string | null;
  recovered: boolean;
  recoveredAt: string | null;
  recoveredOrderNumber: string | null;
  ordersCount: number;
}

type Tab = "payment" | "cart" | "recovered" | "all";

const fmtDate = (s: string | null) => (s ? String(s).slice(0, 16).replace("T", " ") : " - ");

/** "2 days ago" — the owner cares how cold a lead is, not the exact stamp. */
function ago(s: string | null): string {
  if (!s) return "";
  const t = new Date(String(s).replace(" ", "T")).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 31 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

const STAGE_META: Record<string, { label: string; tone: "red" | "amber"; hint: string }> = {
  payment: {
    label: "Payment not completed",
    tone: "red",
    hint: "Order banaya, gateway khola, paisa aaya nahi",
  },
  cart: { label: "Cart only", tone: "amber", hint: "Cart me saaman chhoda, order shuru hi nahi kiya" },
};

const stageMeta = (stage: string) => STAGE_META[stage] ?? STAGE_META.cart;

/** "Slimpax (2 Bottles) ×2, Joshveda ×1" — the whole cart if it's short. */
function itemsLine(items: AbandonedItem[]): string {
  if (!items.length) return "-";
  return items
    .map((i) => {
      const name = String(i.name ?? "item");
      const variant = String(i.variant ?? "").trim();
      return `${name}${variant ? ` (${variant})` : ""} ×${Math.max(1, Number(i.quantity ?? 1))}`;
    })
    .join(", ");
}

/** Where the order came from, as one readable line. */
function originLine(r: AbandonedRow): string {
  const place = [r.city, r.state].filter(Boolean).join(", ");
  return [r.source || "website", place, r.pincode].filter(Boolean).join(" · ");
}

export default function AbandonedPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AbandonedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("payment");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: AbandonedRow[] }>(
        `/abandoned${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      setRows(res.items ?? []);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Could not load abandoned carts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const openRows = rows.filter((r) => !r.recovered);
    const recovered = rows.filter((r) => r.recovered);
    return {
      payment: openRows.filter((r) => r.stage === "payment").length,
      cart: openRows.filter((r) => r.stage === "cart").length,
      recovered: recovered.length,
      atStake: openRows.reduce((n, r) => n + r.value, 0),
      recoveredValue: recovered.reduce((n, r) => n + r.value, 0),
      rate: rows.length ? Math.round((recovered.length / rows.length) * 100) : 0,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (tab === "all") return rows;
    if (tab === "recovered") return rows.filter((r) => r.recovered);
    return rows.filter((r) => !r.recovered && r.stage === tab);
  }, [rows, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  /** This is a call-list, so it has to be able to leave the panel. */
  function exportCsv() {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const body = filtered.map((r) =>
      [
        r.abandonedAt ?? "",
        stageMeta(r.stage).label,
        r.phone,
        r.customerName ?? "",
        r.customerEmail ?? "",
        r.orderNumber ?? "",
        r.itemCount,
        itemsLine(r.items),
        r.value,
        r.couponCode ?? "",
        originLine(r),
        r.ip ?? "",
        r.lastActivityAt ?? "",
        r.ordersCount,
        r.recovered ? "yes" : "no",
        r.recoveredOrderNumber ?? "",
      ]
        .map(esc)
        .join(",")
    );
    const url = URL.createObjectURL(
      new Blob(
        [
          "﻿" +
            [
              "Abandoned at,Stage,Phone,Name,Email,Order,Items,What,Value,Coupon,From,IP,Last activity,Past orders,Recovered,Recovered order",
              ...body,
            ].join("\n"),
        ],
        { type: "text/csv;charset=utf-8;" }
      )
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `meenazo-abandoned-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(q.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abandoned carts"
        subtitle="Jo log saaman chhod gaye — kab, kisne, kahan se, kya aur kitne ka. Payment shuru karke chhoda hua order sabse upar wali priority hai."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon="refresh" onClick={() => load(q.trim() || undefined)} disabled={loading}>
              Refresh
            </Button>
            <Button variant="outline" icon="upload" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
          </div>
        }
      />

      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by number, name, email or order…"
          aria-label="Search abandoned carts"
          className="min-h-[44px] w-full max-w-md rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Search
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(1);
              load();
            }}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Payment not completed"
          value={String(summary.payment)}
          icon={<Icon name="alert" size={16} />}
          tone="amber"
        />
        <MetricTile
          label="Cart only"
          value={String(summary.cart)}
          icon={<Icon name="shopping-bag" size={16} />}
          tone="violet"
        />
        <MetricTile
          label="Value at stake"
          value={formatPrice(summary.atStake)}
          icon={<Icon name="rupee" size={16} />}
          tone="brand"
        />
        <MetricTile
          label={`Recovered (${summary.rate}%)`}
          value={formatPrice(summary.recoveredValue)}
          icon={<Icon name="check" size={16} />}
          tone="blue"
        />
      </div>

      {/* ---------------------------------------------------------------
          Two explainer sections. The numbers above are useless to someone
          who doesn't know WHEN a cart becomes "abandoned" or WHAT they're
          supposed to do about it — so both are said in full, on the page,
          instead of living in a developer's head.
      --------------------------------------------------------------- */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* --- 1. How a row lands here --- */}
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <Icon name="activity" size={14} className="text-brand" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Ye page kaise kaam karta hai
            </h2>
          </div>
          <ol className="divide-y divide-line">
            {[
              {
                n: 1,
                title: "Customer saaman chunta hai",
                body: "Cart me item daala — ya checkout tak pahunch ke payment shuru bhi kar diya. Dono cheezein DB me save hoti hain, isliye tab band karne par bhi kuch khota nahi.",
              },
              {
                n: 2,
                title: "60 minute tak koi activity nahi → row yahan aati hai",
                body: "Sweep har dispatch run par aur is page ke khulte hi chalta hai. Time ABANDONED_AFTER_MINUTES se badla ja sakta hai (default 60 min).",
              },
              {
                n: 3,
                title: "Do tarah ki row banti hai",
                body: "“Cart only” — sirf cart chhoda, order bana hi nahi. “Payment not completed” — order panel me PENDING pada hai, sirf paisa nahi aaya. Dusri wali zyada garam lead hai: address aur item pehle se hain.",
              },
              {
                n: 4,
                title: "Wapas aake order kiya → apne aap Recovered",
                body: "Koi manual tick nahi lagana padta. Row Recovered ho jaati hai aur us order ka number saath dikhta hai.",
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-3 px-4 py-2.5">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-mint text-[11px] font-bold text-brand-dark">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="border-t border-line bg-soft/50 px-4 py-2.5 text-[12px] leading-snug text-muted">
            <span className="font-semibold text-ink">Paise ka dhyan:</span> jis order ka online
            payment nahi aaya, uska pay-online discount apne aap wapas le liya jaata hai. Isliye
            yahan jo rakam dikh rahi hai wahi delivery par milegi — discount wali nahi.
          </p>
        </div>

        {/* --- 2. What to actually do --- */}
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
            <Icon name="message" size={14} className="text-brand" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Ab kya karna chahiye
            </h2>
          </div>
          <ol className="divide-y divide-line">
            {[
              {
                tone: "red" as const,
                tag: "Sabse pehle",
                title: "“Payment not completed” walon ko 1 ghante ke andar call / WhatsApp",
                body: "Inka order aur address already ban chuka hai — sirf payment atka hai. Ye sabse jaldi convert hote hain. Row ke WhatsApp button se seedha unka number khulta hai.",
              },
              {
                tone: "amber" as const,
                tag: "Uske baad",
                title: "“Cart only” walon ko ek nudge bhejo",
                body: "Inhone abhi order shuru bhi nahi kiya, to seedha “payment karo” mat bolo. Item ka naam, price aur ek chhota coupon — bas itna kaafi hai.",
              },
              {
                tone: "blue" as const,
                tag: "Roz",
                title: "Purani rows par dobara mat lago",
                body: "2-3 din se purani cart lead thandi ho chuki hoti hai. History button se dekh lo pehle kabhi order kiya hai ya “Never ordered” hai — pehli baar wale customer ko alag tarah se baat karni padti hai.",
              },
              {
                tone: "green" as const,
                tag: "Check",
                title: "Recovered % upar jaana chahiye",
                body: "Recovered tile hi is page ka scoreboard hai. Follow-up shuru karne ke baad hafte bhar me ye number badhe — nahi badha to message ya timing badlo, list nahi.",
              },
            ].map((s) => (
              <li key={s.title} className="px-4 py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={s.tone}>{s.tag}</Badge>
                  <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                </div>
                <p className="mt-1 text-[12px] leading-snug text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="border-t border-line bg-soft/50 px-4 py-2.5 text-[12px] leading-snug text-muted">
            <span className="font-semibold text-ink">Value at stake</span> = in sab rows ka jod. Ye
            kamaya hua paisa nahi hai — ye wo paisa hai jo abhi table par pada hai. Iska ek hissa bhi
            recover hua to seedha profit hai.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line p-3">
          {([
            { key: "payment", label: "Payment not completed", count: summary.payment },
            { key: "cart", label: "Cart only", count: summary.cart },
            { key: "recovered", label: "Recovered", count: summary.recovered },
            { key: "all", label: "All", count: rows.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              aria-pressed={tab === t.key}
              className={
                "inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
                (tab === t.key ? "bg-brand text-white" : "text-muted hover:bg-soft hover:text-ink")
              }
            >
              {t.label}
              <span
                className={
                  "rounded-full px-1.5 text-[11px] font-bold " +
                  (tab === t.key ? "bg-white/25" : "bg-soft")
                }
              >
                {t.count}
              </span>
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted">
            Show
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="min-h-[44px] rounded-xl border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand">
              <Icon name="clock" size={26} />
            </div>
            <p className="mt-4 font-semibold text-ink">
              {rows.length === 0 ? "Kuch bhi abandoned nahi" : "Is group me kuch nahi"}
            </p>
            <p className="mt-1 max-w-md text-sm text-muted">
              {rows.length === 0
                ? "Cart ya adhoora payment yahan tab aata hai jab woh thodi der tak chhua na jaaye — abhi sab kuch ya to convert ho gaya hai ya abhi chal raha hai."
                : "Doosre tab dekho — pura record All me hai."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/70 text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Kab (abandoned)</th>
                    <th className="px-4 py-3 font-semibold">Kisne</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Kya</th>
                    <th className="px-4 py-3 text-right font-semibold">Kitna</th>
                    <th className="px-4 py-3 font-semibold">Kahan se</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const meta = stageMeta(r.stage);
                    const expanded = open === r.id;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-line/60 align-top last:border-0 hover:bg-soft/70"
                      >
                        <td className="px-4 py-3">
                          <div className="text-xs text-muted">{fmtDate(r.abandonedAt)}</div>
                          <div className="text-[11px] font-semibold text-ink">{ago(r.abandonedAt)}</div>
                          {r.lastActivityAt && (
                            <div className="mt-0.5 text-[11px] text-muted/80">
                              Last touch {fmtDate(r.lastActivityAt)}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-ink">{r.phone}</span>
                          {r.customerName && (
                            <span className="block text-ink">{r.customerName}</span>
                          )}
                          {r.customerEmail && (
                            <span className="block text-[11px] text-muted">{r.customerEmail}</span>
                          )}
                          <span className="mt-1 inline-block text-[11px] text-muted">
                            {r.ordersCount > 0
                              ? `${r.ordersCount} past order${r.ordersCount === 1 ? "" : "s"}`
                              : "Never ordered"}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          {r.orderNumber && (
                            <Link
                              href={`/panel/orders/${encodeURIComponent(String(r.orderId ?? ""))}`}
                              className="mt-1 block font-mono text-[11px] font-semibold text-brand hover:underline"
                            >
                              {r.orderNumber}
                            </Link>
                          )}
                          {r.recovered && (
                            <span className="mt-1 block">
                              <Badge tone="green">
                                Recovered{r.recoveredOrderNumber ? ` · ${r.recoveredOrderNumber}` : ""}
                              </Badge>
                            </span>
                          )}
                        </td>

                        <td className="max-w-[22rem] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setOpen(expanded ? null : r.id)}
                            aria-expanded={expanded}
                            className="text-left text-ink hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            <span className={expanded ? "" : "line-clamp-2"}>{itemsLine(r.items)}</span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {r.itemCount} item{r.itemCount === 1 ? "" : "s"}
                              {r.couponCode ? ` · coupon ${r.couponCode}` : ""}
                            </span>
                          </button>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-bold tabular-nums text-ink">{formatPrice(r.value)}</div>
                          {r.subtotal !== r.value && (
                            <div className="text-[11px] text-muted">
                              subtotal {formatPrice(r.subtotal)}
                            </div>
                          )}
                          {r.paymentMethod && (
                            <div className="text-[11px] uppercase text-muted">{r.paymentMethod}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-xs text-muted">
                          {originLine(r)}
                          {r.ip && <span className="block text-[11px] text-muted/80">{r.ip}</span>}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/91${r.phone.replace(/\D/g, "").slice(-10)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Message on WhatsApp"
                              className="inline-flex min-h-[38px] items-center rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            >
                              WhatsApp
                            </a>
                            <Link
                              href={`/panel/customers?phone=${encodeURIComponent(r.phone)}`}
                              className="inline-flex min-h-[38px] items-center rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-brand hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            >
                              History
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
              <span className="text-xs text-muted" aria-live="polite">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of{" "}
                {filtered.length}
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
                  <span className="px-2 text-sm text-muted">
                    Page {page} of {pageCount}
                  </span>
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

      <p className="text-xs text-muted">
        <span className="font-semibold text-ink">{STAGE_META.payment.label}</span> —{" "}
        {STAGE_META.payment.hint}. Yeh order panel me pending pada hai aur uska pay-online discount
        apne aap hata diya jaata hai, isliye yahan dikhne wali rakam wahi hai jo delivery pe milegi.{" "}
        <span className="font-semibold text-ink">{STAGE_META.cart.label}</span> —{" "}
        {STAGE_META.cart.hint}. Dono tab aate hain jab customer ne kuch der tak unhe chhua na ho
        (ABANDONED_AFTER_MINUTES, default 60 min); wapas aake order karte hi row Recovered ho jaati
        hai.
      </p>
      <div className="h-6" />
    </div>
  );
}
