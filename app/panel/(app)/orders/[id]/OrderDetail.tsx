"use client";

import { Badge, Card } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import type { PanelOrder, OrderItem, LogEntry } from "./types";
import {
  fmtDateTime,
  fmtRelative,
  fmtMoney,
  paymentLabel,
  balanceDue,
  asArray,
} from "./format";

/**
 * Read-only detail view for one order.
 * ---------------------------------------------------------------------------
 * The generic ResourceForm shows every column as a form field in two loose
 * columns — fine for a coupon, useless for an order: the money doesn't add up
 * anywhere, the items are a JSON blob and the timestamps read as raw strings.
 *
 * This is the page the owner actually works from. Everything is grouped by the
 * question it answers — what was ordered, what is owed, when did it happen,
 * where is it going, did it reach fulfillment — and every timestamp is printed
 * in IST with a relative hint, because "when was this placed" is the single
 * most-asked question on this screen.
 */

/* ------------------------------- primitives ------------------------------ */

/** Card heading — small, uppercase, tight against the content below it. */
function Head({ icon, title, right }: { icon: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={14} className="text-brand" />
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** One label/value line. Dense by design — these stack a dozen at a time. */
function Row({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  tone?: "muted" | "strong" | "danger";
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-2">
      <span className="flex-none text-[12px] text-muted">{label}</span>
      {/* Exactly ONE colour class, chosen up front. Appending a fallback
          `text-ink` alongside `text-red-600` puts two same-specificity colour
          utilities on the element, and which one wins is decided by their order
          in the generated stylesheet — not by the order written here. */}
      <span
        className={[
          "min-w-0 text-right text-[13px]",
          mono ? "font-mono" : "",
          tone === "strong" ? "font-bold" : "",
          tone === "danger" ? "font-semibold" : "",
          tone === "danger" ? "text-red-600" : tone === "muted" ? "text-muted" : "text-ink",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

/** A timestamp printed as "20 Aug 2026, 4:32 PM" with a relative hint under it. */
function Stamp({ at }: { at?: string | null }) {
  if (!at) return <span className="text-muted">—</span>;
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span className="tabular-nums">{fmtDateTime(at)}</span>
      <span className="text-[11px] text-muted">{fmtRelative(at)}</span>
    </span>
  );
}

/* --------------------------------- items --------------------------------- */

/** Units on one line. Missing/unparseable counts as 1, never NaN. */
function qty(item: OrderItem): number {
  const n = Number(item.quantity ?? 1);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function ItemsCard({ order }: { order: PanelOrder }) {
  const items = asArray<OrderItem>(order.items);

  return (
    <Card>
      <Head
        icon="shopping-bag"
        title="Items"
        right={
          <span className="text-[11px] font-semibold text-muted">
            {/* Same default as the row below (a line with no quantity is one
                unit) — the two disagreeing made the header contradict the table. */}
            {items.reduce((n, i) => n + qty(i), 0)} unit(s)
          </span>
        }
      />
      {items.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted">No items recorded on this order.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wide text-muted">
                <th className="px-4 py-2 text-left font-semibold">Product</th>
                <th className="px-3 py-2 text-left font-semibold">SKU</th>
                <th className="px-3 py-2 text-right font-semibold">Qty</th>
                <th className="px-3 py-2 text-right font-semibold">Rate</th>
                <th className="px-4 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((it, i) => (
                <tr key={`${it.slug ?? i}-${i}`} className="align-top">
                  <td className="px-4 py-2.5">
                    {/* `||` not `??` — an empty name must fall through to the
                        slug, and `??` only catches null/undefined. */}
                    <span className="font-semibold text-ink">{it.name || it.slug || "—"}</span>
                    {it.variant && <span className="block text-[12px] text-muted">{it.variant}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-muted">
                    {it.variantSku || it.sku || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{qty(it)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {fmtMoney(it.price)}
                    {Number(it.mrp ?? 0) > Number(it.price ?? 0) && (
                      <span className="block text-[11px] text-muted line-through">{fmtMoney(it.mrp)}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                    {fmtMoney(it.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------- payment -------------------------------- */

function PaymentCard({ order }: { order: PanelOrder }) {
  const paid = Number(order.amountPaid ?? 0);
  const due = balanceDue(order);
  const label = paymentLabel(order);

  return (
    <Card>
      <Head
        icon="rupee"
        title="Payment"
        right={<Badge tone={label.tone}>{label.text}</Badge>}
      />
      <div className="divide-y divide-line">
        <Row label="Subtotal" value={fmtMoney(order.subtotal)} />
        {Number(order.discount ?? 0) > 0 && (
          <Row
            label={order.couponCode ? `Coupon (${order.couponCode})` : "Discount"}
            value={`− ${fmtMoney(order.discount)}`}
          />
        )}
        {Number(order.prepaidDiscount ?? 0) > 0 && (
          <Row label="Prepaid discount" value={`− ${fmtMoney(order.prepaidDiscount)}`} />
        )}
        <Row
          label="Shipping"
          value={Number(order.shipping ?? 0) === 0 ? "Free" : fmtMoney(order.shipping)}
        />
        <div className="flex items-center justify-between gap-3 bg-soft/60 px-4 py-2.5">
          <span className="text-[12px] font-bold uppercase tracking-wide text-muted">Order total</span>
          <span className="text-[17px] font-extrabold tabular-nums text-ink">{fmtMoney(order.total)}</span>
        </div>
        <Row label="Already paid" value={fmtMoney(paid)} tone={paid > 0 ? "strong" : "muted"} />
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <span className="text-[12px] font-semibold text-muted">
            {due > 0 ? "To collect on delivery" : "Nothing to collect"}
          </span>
          <span
            className={`text-[15px] font-extrabold tabular-nums ${due > 0 ? "text-amber-700" : "text-brand"}`}
          >
            {fmtMoney(due)}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------- timeline ------------------------------- */

interface Ev {
  at?: string | null;
  title: string;
  note?: string;
  tone: "done" | "wait" | "fail";
}

function TimelineCard({ order }: { order: PanelOrder }) {
  const events: Ev[] = [];

  events.push({ at: order.createdAt, title: "Order placed", note: order.source ?? undefined, tone: "done" });

  if (order.whatsappSentAt)
    events.push({ at: order.whatsappSentAt, title: "WhatsApp confirmation sent", tone: "done" });

  if (order.dispatchAt) {
    const due = new Date(String(order.dispatchAt)).getTime();
    const overdue = Number.isFinite(due) && due <= Date.now();
    events.push({
      at: order.dispatchAt,
      title: order.easyecomSynced ? "Was due at EasyEcom" : "Due to be pushed to EasyEcom",
      note: order.easyecomSynced ? undefined : overdue ? "Overdue — should have gone by now" : "Holding until this time",
      tone: order.easyecomSynced ? "done" : overdue ? "fail" : "wait",
    });
  }

  if (order.easyecomPushedAt)
    events.push({
      at: order.easyecomPushedAt,
      title: "Pushed to EasyEcom",
      note: order.easyecomRef ? `Ref ${order.easyecomRef}` : undefined,
      tone: "done",
    });

  for (const h of asArray<{ at?: string; status?: string; note?: string }>(order.statusHistory)) {
    if (h?.status) events.push({ at: h.at, title: `Status → ${h.status}`, note: h.note, tone: "done" });
  }

  if (order.shipmentStatusAt)
    events.push({
      at: order.shipmentStatusAt,
      title: order.fulfillmentStatus ? `Courier: ${order.fulfillmentStatus}` : "Shipment update",
      tone: "done",
    });

  // Undated events sink to the bottom instead of being compared as NaN — an
  // unparseable date silently made the whole sort non-deterministic.
  const when = (v?: string | null) => {
    const t = v ? new Date(String(v)).getTime() : NaN;
    return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
  };
  events.sort((a, b) => when(a.at) - when(b.at));

  const dot = {
    done: "bg-brand",
    wait: "bg-amber-400",
    fail: "bg-red-500",
  };

  return (
    <Card>
      <Head icon="clock" title="Timeline" />
      <ol className="px-4 py-3">
        {events.map((e, i) => (
          <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
            {i < events.length - 1 && (
              <span className="absolute left-[5px] top-3 h-full w-px bg-line" aria-hidden />
            )}
            <span className={`relative mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${dot[e.tone]}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-[13px] font-semibold text-ink">{e.title}</span>
                <span className="text-[12px] tabular-nums text-muted">{fmtDateTime(e.at)}</span>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                {e.note ? (
                  <span className="text-[12px] text-muted">{e.note}</span>
                ) : (
                  <span />
                )}
                <span className="text-[11px] text-muted">{fmtRelative(e.at)}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* -------------------------------- customer ------------------------------- */

function CustomerCard({ order }: { order: PanelOrder }) {
  const delivery = order.shippingPhone && order.shippingPhone !== order.customerMobile
    ? order.shippingPhone
    : null;

  return (
    <Card>
      <Head icon="users" title="Customer & delivery" />
      <div className="divide-y divide-line">
        <Row label="Name" value={order.customerName ?? "—"} tone="strong" />
        <Row label="Account number" value={order.customerMobile ?? "—"} mono />
        {delivery && <Row label="Delivery number" value={delivery} mono />}
        <Row label="Email" value={order.customerEmail || "—"} />
        <div className="px-4 py-2.5">
          <span className="text-[12px] text-muted">Address</span>
          <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-ink">
            {[order.address, [order.city, order.state].filter(Boolean).join(", "), order.pincode]
              .filter(Boolean)
              .join("\n") || "—"}
          </p>
        </div>
        <Row label="Placed from" value={order.ip ? <span className="font-mono text-[12px]">{order.ip}</span> : "—"} />
      </div>
    </Card>
  );
}

/* ------------------------------- fulfillment ----------------------------- */

function FulfillmentCard({ order }: { order: PanelOrder }) {
  const synced = !!order.easyecomSynced;
  const attempts = Number(order.easyecomAttempts ?? 0);
  const log = asArray<LogEntry>(order.easyecomLog).slice(-3).reverse();

  return (
    <Card>
      <Head
        icon="upload"
        title="EasyEcom"
        right={
          synced ? <Badge tone="green">Pushed</Badge> : <Badge tone="amber">Not pushed</Badge>
        }
      />
      <div className="divide-y divide-line">
        <Row label="Due at" value={<Stamp at={order.dispatchAt} />} />
        <Row label="Pushed at" value={<Stamp at={order.easyecomPushedAt} />} />
        <Row label="Reference" value={order.easyecomRef || "—"} mono />
        {order.easyecomOrderId && <Row label="EasyEcom id" value={order.easyecomOrderId} mono />}
        <Row
          label="Attempts"
          value={attempts > 0 ? `${attempts}` : "none yet"}
          tone={attempts >= 10 ? "danger" : undefined}
        />
      </div>

      {/* 10 mirrors MAX_ATTEMPTS in lib/easyecomDispatch.ts. It can't be
          imported here — that module pulls in mysql2 through panelDb and would
          drag the DB driver into the browser bundle. Change both together. */}
      {attempts >= 10 && !synced && (
        <p className="mx-4 mb-3 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold leading-snug text-red-700 ring-1 ring-red-200">
          Auto-retry has given up after 10 attempts. Fix the cause below, then use
          “Push to EasyEcom now”.
        </p>
      )}

      {order.easyecomError && (
        <div className="mx-4 mb-3 rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">
          <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Last error</p>
          <p className="mt-1 break-words text-[12px] leading-snug text-red-700">{order.easyecomError}</p>
        </div>
      )}

      {log.length > 0 && (
        <div className="border-t border-line px-4 py-2.5">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">Recent attempts</p>
          <ul className="space-y-1">
            {log.map((l, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px]">
                <span className={l.ok ? "text-brand" : "text-red-600"} aria-hidden>
                  {l.ok ? "✓" : "✕"}
                </span>
                <span className="flex-1 break-words text-muted">
                  {l.ok ? (l.ref ?? "pushed") : (l.error ?? "failed")}
                </span>
                <span className="flex-none tabular-nums text-muted">{fmtDateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------- shipment ------------------------------- */

function ShipmentCard({ order }: { order: PanelOrder }) {
  if (!order.fulfillmentStatus && !order.trackingNumber && !order.courier && !order.ndrReason)
    return null;

  return (
    <Card>
      <Head icon="activity" title="Shipment" />
      <div className="divide-y divide-line">
        <Row label="Status" value={order.fulfillmentStatus || "—"} tone="strong" />
        <Row label="Courier" value={order.courier || "—"} />
        <Row label="AWB / tracking" value={order.trackingNumber || "—"} mono />
        <Row label="Last update" value={<Stamp at={order.shipmentStatusAt} />} />
        {order.trackingUrl && (
          <div className="px-4 py-2.5">
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline"
            >
              <Icon name="external" size={13} /> Track shipment
            </a>
          </div>
        )}
        {order.ndrReason && (
          <div className="px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Delivery issue</p>
            <p className="mt-1 text-[12px] leading-snug text-amber-800">{order.ndrReason}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------- WhatsApp ------------------------------- */

function WhatsappCard({ order }: { order: PanelOrder }) {
  const log = asArray<LogEntry>(order.whatsappLog).slice(-3).reverse();
  return (
    <Card>
      <Head
        icon="message"
        title="WhatsApp"
        right={
          order.whatsappSentAt ? <Badge tone="green">Sent</Badge> : <Badge tone="amber">Not sent</Badge>
        }
      />
      <div className="divide-y divide-line">
        <Row label="Confirmation sent" value={<Stamp at={order.whatsappSentAt} />} />
      </div>
      {log.length > 0 && (
        <ul className="space-y-1 border-t border-line px-4 py-2.5">
          {log.map((l, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px]">
              <span className={l.ok ? "text-brand" : "text-red-600"} aria-hidden>
                {l.ok ? "✓" : "✕"}
              </span>
              <span className="flex-1 break-words text-muted">{l.ok ? (l.to ?? "sent") : (l.error ?? "failed")}</span>
              <span className="flex-none tabular-nums text-muted">{fmtDateTime(l.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------------------------------- view --------------------------------- */

export function OrderDetail({ order }: { order: PanelOrder }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <div className="space-y-4 xl:col-span-2">
        <ItemsCard order={order} />
        <PaymentCard order={order} />
        <TimelineCard order={order} />
        {order.adminNote && (
          <Card>
            <Head icon="file-text" title="Note" />
            <p className="whitespace-pre-line px-4 py-3 text-[13px] leading-relaxed text-ink">
              {order.adminNote}
            </p>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <CustomerCard order={order} />
        <FulfillmentCard order={order} />
        <ShipmentCard order={order} />
        <WhatsappCard order={order} />
      </div>
    </div>
  );
}
