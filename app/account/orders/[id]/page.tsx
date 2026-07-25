"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { orderService } from "@/services/orderService";
import { formatDate, formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { StatusPill, statusMeta } from "@/components/account/orderStatus";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  razorpay: "Razorpay",
  upi: "UPI",
};

/** Linear fulfilment journey used to render the timeline. */
const TIMELINE: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "pending", label: "Order placed", icon: "clock" },
  { status: "confirmed", label: "Confirmed", icon: "check-circle" },
  { status: "processing", label: "Processing", icon: "package" },
  { status: "shipped", label: "Shipped", icon: "truck" },
  { status: "delivered", label: "Delivered", icon: "check-circle" },
];

/** Non-linear "exception" states get a banner instead of the progress timeline. */
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

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-40" />
      <div className="card-surface p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="card-surface p-6">
        <Skeleton className="h-40 w-full" />
      </div>
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

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand transition-colors w-fit"
      >
        <Icon name="arrow-left" size={16} /> Back to my orders
      </Link>

      {/* Hero header */}
      <div className="card-surface overflow-hidden p-0">
        <div className="bg-gradient-to-br from-mint via-mint/60 to-white p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow text-brand">Order</p>
              <h2 className="mt-1 font-mono text-2xl font-extrabold text-ink">{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-muted">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <StatusPill status={order.status} className="px-3.5 py-1.5 text-sm" />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="text-muted">
              Items <span className="font-bold text-ink">{itemCount}</span>
            </span>
            <span className="text-muted">
              Total <span className="font-bold text-ink">{formatPrice(order.total)}</span>
            </span>
            <span className="text-muted">
              Payment <span className="font-bold text-ink">{PAYMENT_LABEL[order.paymentMethod]}</span>
            </span>
          </div>

          {order.estimatedDelivery && !exception && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-dark ring-1 ring-brand-light">
              <Icon name="truck" size={18} />
              Estimated delivery by {formatDate(order.estimatedDelivery)}
            </div>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="card-surface p-6">
        <h3 className="mb-6 font-bold text-ink">Order status</h3>
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
          <ol className="relative">
            {TIMELINE.map((step, i) => {
              const done = i <= activeIdx;
              const current = i === activeIdx;
              const last = i === TIMELINE.length - 1;
              return (
                <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                  {!last && (
                    <span
                      className={cn(
                        "absolute left-[18px] top-9 bottom-0 w-0.5",
                        i < activeIdx ? "bg-brand" : "bg-line"
                      )}
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-base transition-colors",
                      done ? "border-brand bg-brand text-white" : "border-line bg-white text-muted",
                      current && "ring-4 ring-brand/15"
                    )}
                    aria-hidden
                  >
                    <Icon name={done ? "check" : step.icon} size={18} />
                  </span>
                  <div className="pt-1">
                    <p className={cn("font-semibold", done ? "text-ink" : "text-muted", current && "text-brand")}>
                      {step.label}
                    </p>
                    {current && <p className="mt-0.5 text-xs font-medium text-brand/80">Current stage</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Shipment tracking */}
      {hasTracking && (
        <div className="card-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Icon name="truck" size={18} className="text-brand" /> Shipment tracking
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
              <Icon name="external" size={16} /> Track shipment
            </a>
          )}
        </div>
      )}

      {/* Tracking history */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="card-surface p-6">
          <h3 className="mb-5 font-bold text-ink">Tracking history</h3>
          <ol className="relative flex flex-col gap-5">
            {[...order.statusHistory].reverse().map((h, i, arr) => (
              <li key={i} className="relative flex gap-3 text-sm">
                {i < arr.length - 1 && (
                  <span className="absolute left-[5px] top-4 bottom-[-20px] w-0.5 bg-line" aria-hidden />
                )}
                <span
                  className={cn(
                    "relative z-10 mt-1 h-3 w-3 shrink-0 rounded-full ring-4 ring-white",
                    i === 0 ? "bg-brand" : "bg-line"
                  )}
                  aria-hidden
                />
                <div>
                  <p className="font-semibold capitalize text-ink">
                    {String(h.status).replace(/_/g, " ")}
                  </p>
                  {h.note && h.note !== h.status && <p className="text-muted">{h.note}</p>}
                  <p className="text-xs text-muted">{formatDate(h.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Items */}
      <div className="card-surface p-6">
        <h3 className="mb-4 font-bold text-ink">Items in this order</h3>
        <div className="flex flex-col divide-y divide-line">
          {order.items.map((item, i) => (
            <div key={item.productId + i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-soft text-2xl ring-1 ring-line" aria-hidden>
                {item.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/product/${item.slug}`}
                  className="font-semibold text-ink transition-colors hover:text-brand line-clamp-1"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-muted">
                  {item.variant || item.unit ? <span>{item.variant ?? item.unit} · </span> : null}
                  Qty {item.quantity} × {formatPrice(item.price)}
                </p>
              </div>
              <div className="text-right font-bold tabular-nums text-ink">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Price summary */}
        <div className="card-surface p-6">
          <h3 className="mb-4 font-bold text-ink">Price summary</h3>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>
                  Discount
                  {order.couponCode && <span className="ml-1 text-xs font-semibold">({order.couponCode})</span>}
                </dt>
                <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
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
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Icon name="credit-card" size={18} />
            Paid via <span className="font-semibold text-ink">{PAYMENT_LABEL[order.paymentMethod]}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="card-surface p-6">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Icon name="map-pin" size={18} className="text-brand" /> Shipping address
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
