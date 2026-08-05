import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { MODELS } from "./panelModels";
import { rowToApi } from "./panelMap";
import { ORDER_STATUSES } from "./panelModels";
import type { Order, OrderItem, OrderStatus, PaymentMethod } from "@/types";

/**
 * Customer-facing order access — reads the REAL orders from the panel DB
 * (keyed by the customer's phone) and maps them to the storefront `Order`
 * shape used by the account order pages. Never exposes another customer's
 * orders: every query is scoped to the signed-in phone.
 */

const PAYMENTS: PaymentMethod[] = ["cod", "razorpay", "upi"];

function toPayment(v: unknown): PaymentMethod {
  const s = String(v ?? "cod").toLowerCase();
  return (PAYMENTS as string[]).includes(s) ? (s as PaymentMethod) : "cod";
}

function toStatus(v: unknown): OrderStatus {
  const s = String(v ?? "pending").toLowerCase();
  return (ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : "pending";
}

function mapItems(raw: unknown): OrderItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((it) => {
    const o = it as Record<string, unknown>;
    const price = Number(o.price ?? 0);
    const quantity = Number(o.quantity ?? 1);
    return {
      productId: String(o.productId ?? o.slug ?? ""),
      name: String(o.name ?? ""),
      slug: String(o.slug ?? ""),
      emoji: String(o.emoji ?? "🌿"),
      image: o.image ? String(o.image) : undefined,
      price,
      quantity,
      unit: o.unit ? String(o.unit) : undefined,
      variant: o.variant ? String(o.variant) : undefined,
      lineTotal: Number(o.lineTotal ?? price * quantity),
    };
  });
}

/** Map a panel-DB order row (camelCase API object) to the storefront Order. */
function mapOrder(api: Record<string, unknown>): Order {
  const history = Array.isArray(api.statusHistory)
    ? (api.statusHistory as { at: string; status: string; note?: string }[])
    : undefined;

  return {
    id: String(api.id),
    orderNumber: String(api.orderNumber ?? api.id),
    items: mapItems(api.items),
    subtotal: Number(api.subtotal ?? 0),
    discount: Number(api.discount ?? 0),
    prepaidDiscount: Number(api.prepaidDiscount ?? 0),
    shipping: Number(api.shipping ?? 0),
    total: Number(api.total ?? 0),
    couponCode: api.couponCode ? String(api.couponCode) : undefined,
    paymentMethod: toPayment(api.paymentMethod),
    status: toStatus(api.status),
    shippingAddress: {
      id: "addr",
      fullName: String(api.customerName ?? ""),
      // Show the delivery contact they entered, not the login number.
      phone: String(api.shippingPhone || api.customerMobile || ""),
      pincode: String(api.pincode ?? ""),
      line1: String(api.address ?? ""),
      city: String(api.city ?? ""),
      state: String(api.state ?? ""),
      country: "India",
      type: "home",
    },
    createdAt: String(api.createdAt ?? new Date().toISOString()),
    fulfillmentStatus: api.fulfillmentStatus ? String(api.fulfillmentStatus) : undefined,
    trackingNumber: api.trackingNumber ? String(api.trackingNumber) : undefined,
    courier: api.courier ? String(api.courier) : undefined,
    trackingUrl: api.trackingUrl ? String(api.trackingUrl) : undefined,
    ndrReason: api.ndrReason ? String(api.ndrReason) : undefined,
    statusHistory: history,
  };
}

/** All orders for a phone, newest first. */
export async function listCustomerOrders(phone: string): Promise<Order[]> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `orders` WHERE customer_mobile = ? ORDER BY created_at DESC",
    [phone]
  );
  return rows.map((r) => mapOrder(rowToApi(MODELS.orders, r)));
}

/** A single order by id/orderNumber, scoped to the phone (null if not theirs). */
export async function getCustomerOrder(phone: string, idOrNumber: string): Promise<Order | null> {
  const pool = getPanelPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM `orders` WHERE customer_mobile = ? AND (id = ? OR order_number = ?) LIMIT 1",
    [phone, idOrNumber, idOrNumber]
  );
  if (!rows.length) return null;
  return mapOrder(rowToApi(MODELS.orders, rows[0]));
}
