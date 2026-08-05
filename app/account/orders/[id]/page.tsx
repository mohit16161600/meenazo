"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { orderService } from "@/services/orderService";
import { siteConfig } from "@/data/site";
import { formatDate, formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { StatusPill, statusMeta } from "@/components/account/orderStatus";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  razorpay: "Paid online",
  upi: "UPI",
};

/** Linear fulfilment journey used to render the tracker. */
const TIMELINE: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "pending", label: "Order placed", icon: "clipboard-check" },
  { status: "confirmed", label: "Confirmed", icon: "check-circle" },
  { status: "processing", label: "Packed", icon: "package" },
  { status: "shipped", label: "In transit", icon: "truck" },
  { status: "delivered", label: "Delivered", icon: "home" },
];

/** Non-linear "exception" states get a banner instead of the progress tracker. */
const EXCEPTION_COPY: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  cancelled: {
    title: "This order was cancelled",
    message: "If you believe this is a mistake, please contact our support team.",
  },
  ndr: {
    title: "Delivery attempt was unsuccessful",
    message:
      "The courier couldn't deliver your order. Our team will reattempt delivery — please keep your phone reachable, or contact support to reschedule.",
  },
  returned: {
    title: "This order was returned",
    message:
      "The shipment came back to us. If you still want it, please contact support and we'll help you re-order.",
  },
};

function timelineIndex(status: OrderStatus): number {
  if (status === "out_for_delivery") return TIMELINE.findIndex((t) => t.status === "shipped");
  return TIMELINE.findIndex((t) => t.status === status);
}

/** When did this order reach a given stage? Read off the webhook timeline. */
function stageDate(order: Order, status: OrderStatus): string | undefined {
  if (status === "pending") return order.createdAt;
  const hit = order.statusHistory?.find((h) => String(h.status).toLowerCase() === status);
  return hit?.at;
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-36 w-full rounded-brand" />
      <Skeleton className="h-32 w-full rounded-brand" />
      <Skeleton className="h-56 w-full rounded-brand" />
    </div>
  );
}

/** One labelled fact in the order-details strip. */
function Fact({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className={cn("mt-1 truncate font-bold text-ink", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    orderService
      .get(id)
      .then((res) => {
        if (!cancelled) setOrder(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!order) {
    return (
      <div className="card-surface">
        <EmptyState
          emoji="🔍"
          title="Order not found"
          message="We couldn't find that order. It may have been removed or the link is incorrect."
          actionLabel="Back to my orders"
          actionHref="/account/orders"
        />
      </div>
    );
  }

  const activeIdx = timelineIndex(order.status);
  const exception = EXCEPTION_COPY[order.status];
  const itemCount = order.items.reduce((n, it) => n + it.quantity, 0);
  const hasTracking = order.trackingNumber || order.courier || order.trackingUrl || order.fulfillmentStatus;
  const savings = (order.discount ?? 0) + (order.prepaidDiscount ?? 0);
  const helpHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    `Hi Meenazo, I need help with my order ${order.orderNumber}.`
  )}`;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <Link
        href="/account/orders"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-brand"
      >
        <Icon name="arrow-left" size={16} /> Back to my orders
      </Link>

      {/* ============ Order details ============ */}
      <div className="card-surface overflow-hidden p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-gradient-to-br from-mint via-mint/50 to-white p-5 sm:p-6">
          <div>
            <p className="eyebrow text-brand">Order tracking</p>
            <h2 className="mt-1 font-mono !text-2xl font-extrabold">{order.orderNumber}</h2>
            <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={order.status} className="px-3.5 py-1.5 text-sm" />
            <a
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Icon name="whatsapp" size={14} /> Need help?
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4 sm:p-6">
          <Fact label="Items" value={`${itemCount} ${itemCount === 1 ? "item" : "items"}`} />
          <Fact label="Order total" value={formatPrice(order.total)} />
          <Fact label="Payment" value={PAYMENT_LABEL[order.paymentMethod]} />
          <Fact
            label={order.status === "delivered" ? "Delivered on" : "Expected delivery"}
            value={
              order.estimatedDelivery || order.createdAt
                ? formatDate(order.estimatedDelivery ?? order.createdAt)
                : "—"
            }
          />
        </dl>
      </div>

      {/* ============ Progress tracker ============ */}
      <div className="card-surface p-5 sm:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold text-ink">Order progress</h3>
          {!exception && order.estimatedDelivery && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-xs font-semibold text-brand-dark">
              <Icon name="truck" size={14} /> Arriving by {formatDate(order.estimatedDelivery)}
            </span>
          )}
        </div>

        {exception ? (
          <div className="flex items-start gap-3 rounded-brand bg-red-50 p-4 text-red-700 ring-1 ring-red-100">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-red-100">
              <Icon name={statusMeta(order.status).icon} size={20} />
            </span>
            <div>
              <p className="font-bold">{exception.title}</p>
              <p className="text-sm text-red-600/80">{exception.message}</p>
              {order.ndrReason && (
                <p className="mt-1 text-sm text-red-600/80">
                  Reason: <span className="font-semibold">{order.ndrReason}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Horizontal tracker (tablet and up) */}
            <ol className="hidden sm:flex">
              {TIMELINE.map((step, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx;
                const at = stageDate(order, step.status);
                return (
                  <li key={step.status} className="relative flex-1 text-center">
                    {/* connector to the previous dot */}
                    {i > 0 && (
                      <span
                        className={cn(
                          "absolute right-1/2 top-5 h-1 w-full -translate-y-1/2 rounded-full",
                          i <= activeIdx ? "bg-brand" : "bg-line"
                        )}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 mx-auto grid h-10 w-10 place-items-center rounded-full border-2 transition-colors",
                        done ? "border-brand bg-brand text-white" : "border-line bg-white text-muted",
                        current && "ring-4 ring-brand/15"
                      )}
                      aria-hidden
                    >
                      <Icon name={done && !current ? "check" : step.icon} size={18} />
                    </span>
                    <p
                      className={cn(
                        "mt-2.5 text-sm font-semibold",
                        current ? "text-brand" : done ? "text-ink" : "text-muted"
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{at ? formatDate(at) : current ? "In progress" : "—"}</p>
                  </li>
                );
              })}
            </ol>

            {/* Vertical tracker (phones) */}
            <ol className="sm:hidden">
              {TIMELINE.map((step, i) => {
                const done = i <= activeIdx;
                const current = i === activeIdx;
                const last = i === TIMELINE.length - 1;
                const at = stageDate(order, step.status);
                return (
                  <li key={step.status} className="relative flex gap-4 pb-7 last:pb-0">
                    {!last && (
                      <span
                        className={cn(
                          "absolute bottom-0 left-[19px] top-10 w-0.5",
                          i < activeIdx ? "bg-brand" : "bg-line"
                        )}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2",
                        done ? "border-brand bg-brand text-white" : "border-line bg-white text-muted",
                        current && "ring-4 ring-brand/15"
                      )}
                      aria-hidden
                    >
                      <Icon name={done && !current ? "check" : step.icon} size={18} />
                    </span>
                    <div className="pt-1.5">
                      <p className={cn("font-semibold", current ? "text-brand" : done ? "text-ink" : "text-muted")}>
                        {step.label}
                      </p>
                      <p className="text-xs text-muted">{at ? formatDate(at) : current ? "In progress" : "Pending"}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </div>

      {/* ============ Shipment tracking ============ */}
      {hasTracking && (
        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Icon name="truck" size={18} className="text-brand" /> Shipment details
          </h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            {order.courier && (
              <div className="rounded-xl bg-soft p-3">
                <dt className="text-xs text-muted">Courier</dt>
                <dd className="mt-0.5 font-semibold text-ink">{order.courier}</dd>
              </div>
            )}
            {order.trackingNumber && (
              <div className="rounded-xl bg-soft p-3">
                <dt className="text-xs text-muted">Tracking / AWB</dt>
                <dd className="mt-0.5 font-mono font-semibold text-ink">{order.trackingNumber}</dd>
              </div>
            )}
            {order.fulfillmentStatus && (
              <div className="rounded-xl bg-soft p-3">
                <dt className="text-xs text-muted">Latest update</dt>
                <dd className="mt-0.5 font-semibold text-ink">{order.fulfillmentStatus}</dd>
              </div>
            )}
          </dl>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
            >
              <Icon name="external" size={16} /> Track on courier site
            </a>
          )}
        </div>
      )}

      {/* ============ Tracking history ============ */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-5 font-bold text-ink">Tracking history</h3>
          <ol className="relative flex flex-col gap-5">
            {[...order.statusHistory].reverse().map((h, i, arr) => (
              <li key={i} className="relative flex gap-3 text-sm">
                {i < arr.length - 1 && (
                  <span className="absolute bottom-[-20px] left-[5px] top-4 w-0.5 bg-line" aria-hidden />
                )}
                <span
                  className={cn(
                    "relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white",
                    i === 0 ? "bg-brand" : "bg-line"
                  )}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold capitalize text-ink">{String(h.status).replace(/_/g, " ")}</p>
                  {h.note && h.note !== h.status && <p className="text-muted">{h.note}</p>}
                  <p className="text-xs text-muted">{formatDate(h.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ============ Items ============ */}
      <div className="card-surface overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h3 className="font-bold text-ink">Items in this order</h3>
          <span className="chip chip-soft">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Table header — desktop only */}
        <div className="hidden border-b border-line bg-soft/60 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted sm:grid sm:grid-cols-[1fr_100px_110px_110px]">
          <span>Product</span>
          <span className="text-center">Pack</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Price</span>
        </div>

        <ul className="divide-y divide-line">
          {order.items.map((item, i) => (
            <li
              key={item.productId + i}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_100px_110px_110px] sm:gap-0 sm:px-6"
            >
              <div className="col-span-2 flex min-w-0 items-center gap-3 sm:col-span-1">
                <ArtPlaceholder
                  emoji={item.emoji}
                  src={item.image}
                  alt={item.name}
                  fontSize={24}
                  className="h-14 w-14 flex-none rounded-xl ring-1 ring-line"
                />
                <div className="min-w-0">
                  <Link
                    href={`/product/${item.slug}`}
                    className="line-clamp-2 font-semibold leading-snug text-ink transition-colors hover:text-brand"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted sm:hidden">
                    {item.variant || item.unit ? `${item.variant ?? item.unit} · ` : ""}Qty {item.quantity}
                  </p>
                </div>
              </div>
              <span className="hidden text-center text-sm text-muted sm:block">
                {item.variant ?? item.unit ?? "—"}
              </span>
              <span className="hidden text-center text-sm font-semibold text-ink sm:block">
                {item.quantity}
              </span>
              <span className="text-right font-bold tabular-nums text-ink">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ============ Totals + address ============ */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 font-bold text-ink">Price summary</h3>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>
                  Coupon
                  {order.couponCode && <span className="ml-1 text-xs font-semibold">({order.couponCode})</span>}
                </dt>
                <dd className="tabular-nums">−{formatPrice(order.discount)}</dd>
              </div>
            )}
            {(order.prepaidDiscount ?? 0) > 0 && (
              <div className="flex justify-between text-brand">
                <dt>Prepaid discount</dt>
                <dd className="tabular-nums">−{formatPrice(order.prepaidDiscount ?? 0)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tabular-nums">
                {order.shipping === 0 ? (
                  <span className="font-semibold text-brand">Free</span>
                ) : (
                  formatPrice(order.shipping)
                )}
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-line pt-3 text-base font-extrabold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          {savings > 0 && (
            <p className="mt-3 rounded-brand bg-mint px-3 py-2 text-xs font-bold text-brand-dark">
              🎉 You saved {formatPrice(savings)} on this order
            </p>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Icon name="credit-card" size={18} />
            <span className="font-semibold text-ink">{PAYMENT_LABEL[order.paymentMethod]}</span>
          </div>
        </div>

        <div className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Icon name="map-pin" size={18} className="text-brand" /> Delivery address
          </h3>
          <address className="not-italic text-sm leading-relaxed text-muted">
            <span className="font-semibold text-ink">{order.shippingAddress.fullName}</span>
            <br />
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? (
              <>
                <br />
                {order.shippingAddress.line2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
            <br />
            {order.shippingAddress.country}
            <br />
            <span className="mt-2 inline-flex items-center gap-1">
              <Icon name="phone" size={14} /> {order.shippingAddress.phone}
            </span>
          </address>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="/shop" variant="ghost" size="sm">
          Continue shopping
        </Button>
        <Button href="/account/orders" variant="dark" size="sm">
          All orders
        </Button>
      </div>
    </div>
  );
}
