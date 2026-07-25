import type { OrderStatus } from "@/types";

/**
 * Map an EasyEcom / courier status string to our internal OrderStatus.
 * EasyEcom sends free-text statuses that vary by courier, so we match on
 * keywords rather than exact values. Unknown text leaves the internal status
 * unchanged (the raw text is still stored in `fulfillment_status`).
 */
export function mapEasyEcomStatus(raw: string | null | undefined): OrderStatus | null {
  const s = String(raw ?? "").toLowerCase().trim();
  if (!s) return null;

  // Order matters — check the most specific / terminal states first.
  if (/(rto|return to origin|returned|return)/.test(s)) return "returned";
  if (/(ndr|undeliver|failed delivery|delivery failed|not delivered)/.test(s)) return "ndr";
  if (/deliver/.test(s)) return "delivered"; // "delivered" (after the undeliver check)
  if (/(cancel|void)/.test(s)) return "cancelled";
  if (/(out for delivery|ofd)/.test(s)) return "out_for_delivery";
  if (/(ship|manifest|dispatch|in transit|intransit|picked)/.test(s)) return "shipped";
  if (/(process|pack|ready|new order|confirm)/.test(s)) return "processing";
  return null;
}

/** Human label for an OrderStatus (customer + admin facing). */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  ndr: "Delivery attempt failed",
  returned: "Returned",
};
