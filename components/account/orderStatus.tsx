import { cn } from "@/utils/cn";
import type { OrderStatus } from "@/types";

/**
 * One source of truth for how an order status looks across the account UI —
 * label, icon, dot colour, pill styling and the accent bar. Keeps the orders
 * list and the order detail page perfectly consistent.
 */
export interface StatusMeta {
  label: string;
  icon: string;
  dot: string; // dot background
  pill: string; // pill background + text + ring
  bar: string; // left accent-bar background
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  pending: { label: "Pending", icon: "clock", dot: "bg-amber-400", pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", bar: "bg-amber-400" },
  confirmed: { label: "Confirmed", icon: "check-circle", dot: "bg-sky-400", pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-200", bar: "bg-sky-400" },
  processing: { label: "Processing", icon: "package", dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700 ring-1 ring-sky-200", bar: "bg-sky-500" },
  shipped: { label: "Shipped", icon: "truck", dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200", bar: "bg-indigo-500" },
  out_for_delivery: { label: "Out for delivery", icon: "truck", dot: "bg-violet-500", pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200", bar: "bg-violet-500" },
  delivered: { label: "Delivered", icon: "check-circle", dot: "bg-brand", pill: "bg-mint text-brand-dark ring-1 ring-brand-light", bar: "bg-brand" },
  cancelled: { label: "Cancelled", icon: "close", dot: "bg-red-500", pill: "bg-red-50 text-red-700 ring-1 ring-red-200", bar: "bg-red-500" },
  ndr: { label: "Delivery failed", icon: "alert", dot: "bg-red-500", pill: "bg-red-50 text-red-700 ring-1 ring-red-200", bar: "bg-red-500" },
  returned: { label: "Returned", icon: "return", dot: "bg-red-500", pill: "bg-red-50 text-red-700 ring-1 ring-red-200", bar: "bg-red-500" },
};

export function statusMeta(status: OrderStatus): StatusMeta {
  return STATUS_META[status] ?? STATUS_META.pending;
}

/** Compact status pill with a colour dot — used on cards and headers. */
export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const m = statusMeta(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap",
        m.pill,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} aria-hidden />
      {m.label}
    </span>
  );
}
