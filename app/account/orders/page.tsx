"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { formatDate, formatPrice } from "@/utils/format";
import type { Order, OrderStatus } from "@/types";

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

function statusTone(status: OrderStatus): Tone {
  return STATUS_TONE[status] ?? "soft";
}

function OrderCardSkeleton() {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40 mt-3" />
      <div className="flex items-center gap-2 mt-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="flex items-center justify-between mt-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    orderService
      .list(user?.id)
      .then((res) => {
        if (!cancelled) setOrders(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="card-surface">
        <EmptyState
          emoji="📦"
          title="No orders yet"
          message="Once you place an order, you'll be able to track it and view its details right here."
          actionLabel="Start shopping"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-ink">My Orders</h2>
        <p className="text-sm text-muted">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {orders.map((order) => {
        const itemCount = order.items.reduce((n, it) => n + it.quantity, 0);
        const previewItems = order.items.slice(0, 4);
        const extra = order.items.length - previewItems.length;
        return (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="card-surface card-hover p-5 block group"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-ink">{order.orderNumber}</span>
                <Badge variant={statusTone(order.status)}>{STATUS_LABEL[order.status]}</Badge>
              </div>
              <span className="text-sm text-muted">{formatDate(order.createdAt)}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {previewItems.map((item, i) => (
                <span
                  key={item.productId + i}
                  className="grid place-items-center h-10 w-10 rounded-full bg-soft text-lg"
                  title={item.name}
                  aria-hidden
                >
                  {item.emoji}
                </span>
              ))}
              {extra > 0 && (
                <span className="grid place-items-center h-10 w-10 rounded-full bg-mint text-xs font-bold text-brand-dark">
                  +{extra}
                </span>
              )}
              <span className="text-sm text-muted ml-1">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-xs text-muted">Order total</p>
                <p className="font-extrabold text-ink">{formatPrice(order.total)}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                View details
                <Icon
                  name="arrow-right"
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
