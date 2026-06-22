"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { orderService } from "@/services/orderService";
import { formatDate, formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Order, OrderStatus, PaymentMethod } from "@/types";

type Tone = "brand" | "soft" | "gold" | "red";

const STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "gold",
  confirmed: "gold",
  processing: "soft",
  shipped: "soft",
  out_for_delivery: "soft",
  delivered: "brand",
  cancelled: "red",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

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

function timelineIndex(status: OrderStatus): number {
  if (status === "cancelled") return -1;
  if (status === "out_for_delivery") {
    // treat as between shipped and delivered
    return TIMELINE.findIndex((t) => t.status === "shipped");
  }
  const idx = TIMELINE.findIndex((t) => t.status === status);
  return idx;
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
  const cancelled = order.status === "cancelled";

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand transition-colors w-fit"
      >
        <Icon name="arrow-left" size={16} /> Back to my orders
      </Link>

      {/* Header */}
      <div className="card-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Order</p>
            <h2 className="text-2xl font-extrabold text-ink">{order.orderNumber}</h2>
            <p className="text-sm text-muted mt-1">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Badge variant={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
        </div>

        {order.estimatedDelivery && !cancelled && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-mint px-4 py-2 text-sm font-semibold text-brand-dark">
            <Icon name="truck" size={18} />
            Estimated delivery by {formatDate(order.estimatedDelivery)}
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="card-surface p-6">
        <h3 className="font-bold text-ink mb-6">Order status</h3>
        {cancelled ? (
          <div className="flex items-center gap-3 rounded-brand bg-red-50 p-4 text-red-700">
            <Icon name="close" size={24} className="shrink-0" />
            <div>
              <p className="font-bold">This order was cancelled</p>
              <p className="text-sm text-red-600/80">
                If you believe this is a mistake, please contact our support team.
              </p>
            </div>
          </div>
        ) : (
          <ol className="relative">
            {TIMELINE.map((step, i) => {
              const done = i <= activeIdx;
              const current = i === activeIdx;
              const last = i === TIMELINE.length - 1;
              return (
                <li key={step.status} className="flex gap-4 pb-8 last:pb-0 relative">
                  {/* connector line */}
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
                      "relative z-10 grid place-items-center h-9 w-9 rounded-full text-base shrink-0 border-2 transition-colors",
                      done
                        ? "bg-brand border-brand text-white"
                        : "bg-white border-line text-muted"
                    )}
                    aria-hidden
                  >
                    <Icon name={done ? "check" : step.icon} size={18} />
                  </span>
                  <div className="pt-1">
                    <p
                      className={cn(
                        "font-semibold",
                        done ? "text-ink" : "text-muted",
                        current && "text-brand"
                      )}
                    >
                      {step.label}
                    </p>
                    {current && (
                      <p className="text-xs text-brand/80 mt-0.5 font-medium">Current stage</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Items table */}
      <div className="card-surface p-6">
        <h3 className="font-bold text-ink mb-4">Items in this order</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted border-b border-line">
                <th className="py-2 pr-3 font-semibold">Product</th>
                <th className="py-2 px-3 font-semibold text-center">Qty</th>
                <th className="py-2 px-3 font-semibold text-right">Price</th>
                <th className="py-2 pl-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={item.productId + i} className="border-b border-line last:border-0">
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid place-items-center h-10 w-10 rounded-full bg-soft text-lg shrink-0"
                        aria-hidden
                      >
                        {item.emoji}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-semibold text-ink hover:text-brand transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        {item.unit && <p className="text-xs text-muted">{item.unit}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-3 px-3 text-right tabular-nums">{formatPrice(item.price)}</td>
                  <td className="py-3 pl-3 text-right font-semibold tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Price summary */}
        <div className="card-surface p-6">
          <h3 className="font-bold text-ink mb-4">Price summary</h3>
          <dl className="flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>
                  Discount
                  {order.couponCode && (
                    <span className="ml-1 text-xs font-semibold">({order.couponCode})</span>
                  )}
                </dt>
                <dd className="tabular-nums">− {formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Shipping</dt>
              <dd className="tabular-nums">
                {order.shipping === 0 ? (
                  <span className="text-brand font-semibold">Free</span>
                ) : (
                  formatPrice(order.shipping)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 mt-1 text-base font-extrabold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(order.total)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Icon name="credit-card" size={18} />
            Paid via{" "}
            <span className="font-semibold text-ink">{PAYMENT_LABEL[order.paymentMethod]}</span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="card-surface p-6">
          <h3 className="font-bold text-ink mb-4">Shipping address</h3>
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
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
            <br />
            {order.shippingAddress.country}
            <br />
            <span className="inline-flex items-center gap-1 mt-2">
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
