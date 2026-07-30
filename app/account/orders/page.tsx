"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { useAuth } from "@/context/AuthContext";
import { orderService } from "@/services/orderService";
import { formatDate, formatPrice } from "@/utils/format";
import { cn } from "@/utils/cn";
import { StatusPill, statusMeta } from "@/components/account/orderStatus";
import type { Order, OrderStatus } from "@/types";

type FilterKey = "all" | "active" | "delivered" | "issues";

const ACTIVE: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "out_for_delivery"];
const ISSUES: OrderStatus[] = ["cancelled", "ndr", "returned"];

function inFilter(status: OrderStatus, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "active") return ACTIVE.includes(status);
  if (key === "delivered") return status === "delivered";
  return ISSUES.includes(status);
}

function OrderCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-soft/60 px-5 py-3.5">
        <div>
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-1.5 h-3 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="flex-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");

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

  const counts = useMemo(() => {
    const c = { all: orders.length, active: 0, delivered: 0, issues: 0 };
    for (const o of orders) {
      if (ACTIVE.includes(o.status)) c.active++;
      else if (o.status === "delivered") c.delivered++;
      else if (ISSUES.includes(o.status)) c.issues++;
    }
    return c;
  }, [orders]);

  const visible = useMemo(() => orders.filter((o) => inFilter(o.status, filter)), [orders, filter]);

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

  const tabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "In progress", count: counts.active },
    { key: "delivered", label: "Delivered", count: counts.delivered },
    { key: "issues", label: "Issues", count: counts.issues },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold text-ink">My Orders</h2>
        <p className="text-sm text-muted">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === t.key
                ? "bg-brand text-white shadow-brand"
                : "bg-white text-muted ring-1 ring-line hover:text-ink hover:ring-brand/30"
            )}
          >
            {t.label}
            <span
              className={cn(
                "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold",
                filter === t.key ? "bg-white/25 text-white" : "bg-soft text-muted"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card-surface p-10 text-center text-muted">
          No orders in this view.
        </div>
      ) : (
        visible.map((order) => {
          const meta = statusMeta(order.status);
          const itemCount = order.items.reduce((n, it) => n + it.quantity, 0);
          const previewItems = order.items.slice(0, 3);
          const extra = order.items.length - previewItems.length;
          const tracking = order.trackingNumber || order.courier;
          return (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="card-surface card-hover relative block overflow-hidden group"
            >
              {/* status accent bar */}
              <span className={cn("absolute inset-y-0 left-0 w-1.5", meta.bar)} aria-hidden />

              {/* header strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-soft/60 px-5 py-3.5 pl-6">
                <div>
                  <span className="font-mono text-[15px] font-bold tracking-wide text-ink">
                    {order.orderNumber}
                  </span>
                  <p className="mt-0.5 text-xs text-muted">
                    Placed {formatDate(order.createdAt)} · {itemCount}{" "}
                    {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <StatusPill status={order.status} />
              </div>

              <div className="p-5 pl-6">
                {/* items with product images */}
                <ul className="space-y-3">
                  {previewItems.map((item, i) => (
                    <li key={item.productId + i} className="flex items-center gap-3">
                      <ArtPlaceholder
                        emoji={item.emoji}
                        src={item.image}
                        alt={item.name}
                        fit="cover"
                        fontSize={22}
                        sizes="56px"
                        className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-soft ring-1 ring-line"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {[item.variant ?? item.unit, `Qty ${item.quantity}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="flex-none text-sm font-bold tabular-nums text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                {extra > 0 && (
                  <p className="mt-2.5 pl-[68px] text-xs font-semibold text-brand">
                    +{extra} more {extra === 1 ? "item" : "items"}
                  </p>
                )}

                {tracking && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-soft px-2.5 py-1 text-xs font-medium text-muted">
                    <Icon name="truck" size={14} className="text-brand" />
                    {order.courier && <span className="text-ink">{order.courier}</span>}
                    {order.trackingNumber && <span className="font-mono">· {order.trackingNumber}</span>}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <div>
                    <p className="text-xs text-muted">Order total</p>
                    <p className="text-lg font-extrabold text-ink">{formatPrice(order.total)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-brand transition-colors group-hover:bg-brand-dark">
                    View details
                    <Icon
                      name="arrow-right"
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
