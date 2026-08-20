/**
 * The order row as the panel API hands it back (lib/panelModels.ts → orders).
 * Only the fields this screen reads are declared; everything is optional
 * because a row written before a column existed simply won't carry it.
 */
export interface PanelOrder {
  id?: string | number;
  orderNumber?: string;
  status?: string;

  customerName?: string;
  customerMobile?: string;
  shippingPhone?: string | null;
  customerEmail?: string | null;
  address?: string;
  city?: string | null;
  state?: string;
  pincode?: string | null;
  ip?: string | null;
  source?: string | null;

  items?: unknown;
  subtotal?: number;
  discount?: number;
  prepaidDiscount?: number | null;
  shipping?: number;
  total?: number;
  couponCode?: string | null;
  paymentMethod?: string;
  amountPaid?: number | null;

  easyecomSynced?: boolean;
  easyecomRef?: string | null;
  easyecomOrderId?: string | null;
  easyecomPushedAt?: string | null;
  easyecomAttempts?: number | null;
  easyecomError?: string | null;
  easyecomLog?: unknown;
  dispatchAt?: string | null;

  fulfillmentStatus?: string | null;
  shipmentStatusAt?: string | null;
  trackingNumber?: string | null;
  courier?: string | null;
  trackingUrl?: string | null;
  ndrReason?: string | null;
  statusHistory?: unknown;

  whatsappSentAt?: string | null;
  whatsappLog?: unknown;

  adminNote?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** One priced line on the order (lib/orderCapture.ts → PricedItem). */
export interface OrderItem {
  name?: string;
  slug?: string;
  sku?: string;
  variantSku?: string;
  variant?: string;
  unit?: string;
  quantity?: number;
  price?: number;
  mrp?: number;
  lineTotal?: number;
}

/** An entry in the EasyEcom / WhatsApp attempt logs. */
export interface LogEntry {
  at?: string;
  ok?: boolean;
  ref?: string;
  to?: string;
  error?: string;
}
