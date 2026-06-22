"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";

import { orderService } from "@/services/orderService";
import { formatPrice, formatDate } from "@/utils/format";
import type { Order, PaymentMethod } from "@/types";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
  razorpay: "Razorpay (Cards / NetBanking / Wallets)",
};

function SummaryRow({
  label,
  value,
  strong,
  accent,
}: {
  label: string;
  value: string;
  strong?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={strong ? "font-bold text-ink" : "text-muted"}>{label}</span>
      <span
        className={
          accent
            ? "font-bold text-brand"
            : strong
              ? "text-base font-extrabold tabular-nums"
              : "font-semibold tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Skeleton className="mx-auto h-20 w-20 rounded-full" />
      <Skeleton className="mx-auto h-8 w-64 rounded-lg" />
      <Skeleton className="h-64 w-full rounded-brand" />
    </div>
  );
}

function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!orderNumber) {
      setLoading(false);
      return;
    }
    setLoading(true);
    orderService
      .get(orderNumber)
      .then((res) => {
        if (active) {
          setOrder(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setOrder(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [orderNumber]);

  if (loading) return <LoadingState />;

  /* ---- Graceful fallback when no order is found ---- */
  if (!order) {
    return (
      <div className="card-surface mx-auto max-w-2xl">
        <EmptyState
          emoji="🔍"
          title="We couldn't find that order"
          message="The order reference may be incorrect or has expired. You can view all your orders from your account."
          actionLabel="Continue shopping"
          actionHref="/shop"
        >
          <Button variant="ghost" href="/account/orders" className="mt-3">
            View my orders
          </Button>
        </EmptyState>
      </div>
    );
  }

  const shippingAddr = order.shippingAddress;

  return (
    <div className="mx-auto max-w-2xl animate-slideUp">
      {/* Celebration */}
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-mint shadow-brand">
          <Icon name="check-circle" size={64} className="text-brand" />
        </div>
        <span className="eyebrow">Order confirmed</span>
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Your Ayurvedic essentials are on their way. We&apos;ve emailed your confirmation and will
          notify you when your order ships. 🌿
        </p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-sm">
          <span className="text-muted">Order number</span>
          <span className="font-bold tracking-wide text-ink">{order.orderNumber}</span>
        </p>
      </div>

      {/* Order detail card */}
      <div className="card-surface mt-8 p-5 sm:p-7">
        {/* Meta */}
        <div className="grid grid-cols-1 gap-4 border-b border-line pb-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order date</p>
            <p className="mt-1 text-sm font-semibold">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment</p>
            <p className="mt-1 text-sm font-semibold">{PAYMENT_LABELS[order.paymentMethod]}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Estimated delivery
            </p>
            <p className="mt-1 text-sm font-semibold text-brand">
              {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : "3–5 business days"}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="border-b border-line py-5">
          <h2 className="mb-4 !text-lg">
            Items <span className="text-sm font-medium text-muted">({order.items.length})</span>
          </h2>
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <ArtPlaceholder
                  emoji={item.emoji}
                  src={item.image}
                  alt={item.name}
                  fontSize={24}
                  className="h-12 w-12 flex-none rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.unit ? `${item.unit} · ` : ""}Qty {item.quantity}
                  </p>
                </div>
                <span className="flex-none text-sm font-bold tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="space-y-2.5 border-b border-line py-5">
          <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && (
            <SummaryRow
              label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
              value={`− ${formatPrice(order.discount)}`}
              accent
            />
          )}
          <SummaryRow
            label="Shipping"
            value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
          />
          <div className="mt-2 border-t border-line pt-3">
            <SummaryRow label="Total paid" value={formatPrice(order.total)} strong />
          </div>
        </div>

        {/* Shipping address */}
        <div className="pt-5">
          <h2 className="mb-2 !text-lg">Delivering to</h2>
          <address className="not-italic text-sm leading-relaxed text-muted">
            <span className="font-semibold text-ink">{shippingAddr.fullName}</span>
            <br />
            {shippingAddr.line1}
            {shippingAddr.line2 ? `, ${shippingAddr.line2}` : ""}
            <br />
            {shippingAddr.city}, {shippingAddr.state} {shippingAddr.pincode}
            <br />
            {shippingAddr.country}
            <br />
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Icon name="phone" size={14} />
              {shippingAddr.phone}
            </span>
          </address>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button href="/shop" size="lg">
          Continue shopping
        </Button>
        <Button href="/account/orders" variant="ghost" size="lg">
          View my orders
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <Suspense fallback={<LoadingState />}>
          <OrderSuccess />
        </Suspense>
      </Container>
    </section>
  );
}
