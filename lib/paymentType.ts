/**
 * Payment TYPE — derived, never stored twice.
 * ---------------------------------------------------------------------------
 * `paymentMethod` says HOW the customer chose to pay (cod / razorpay / upi);
 * how much actually landed is `amountPaid`. The distinction the owner cares
 * about day to day is the money one:
 *
 *   prepaid  — the whole total is already collected
 *   partial  — some money collected, the balance is due on delivery
 *   cod      — nothing collected yet
 *
 * Deriving it in ONE place keeps the dashboard, the orders list, the filters
 * and EasyEcom's payment mode from ever disagreeing.
 */

export type PaymentType = "prepaid" | "partial" | "cod";

export const PAYMENT_TYPES: { value: PaymentType; label: string }[] = [
  { value: "prepaid", label: "Prepaid" },
  { value: "partial", label: "Partial payment" },
  { value: "cod", label: "Cash on delivery" },
];

export function paymentTypeOf(order: {
  amountPaid?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  status?: unknown;
}): PaymentType {
  const total = Math.max(0, Number(order.total ?? 0));
  const method = String(order.paymentMethod ?? "cod").toLowerCase();
  const raw = order.amountPaid;

  // No amount recorded yet: fall back to the chosen method. An online order is
  // only "prepaid" once it is past the unpaid `pending` state — otherwise a
  // half-finished Razorpay checkout would count as money in the bank.
  if (raw === null || raw === undefined || raw === "") {
    if (method === "cod") return "cod";
    return String(order.status ?? "pending").toLowerCase() === "pending" ? "cod" : "prepaid";
  }

  const paid = Math.max(0, Number(raw) || 0);
  if (paid <= 0) return "cod";
  if (total > 0 && paid >= total) return "prepaid";
  return "partial";
}

/** Rupees still to be collected from the customer (0 when fully prepaid). */
export function balanceDue(order: { amountPaid?: unknown; total?: unknown; paymentMethod?: unknown; status?: unknown }): number {
  const total = Math.max(0, Number(order.total ?? 0));
  if (paymentTypeOf(order) === "prepaid") return 0;
  const paid = Math.max(0, Number(order.amountPaid ?? 0) || 0);
  return Math.max(0, total - paid);
}

/** SQL fragment computing the payment type — keeps aggregates in one place. */
export const PAYMENT_TYPE_SQL = `
  CASE
    WHEN COALESCE(amount_paid, 0) <= 0
      AND (payment_method = 'cod' OR amount_paid IS NULL AND status = 'pending') THEN 'cod'
    WHEN COALESCE(amount_paid, 0) <= 0 AND amount_paid IS NULL THEN 'prepaid'
    WHEN COALESCE(amount_paid, 0) <= 0 THEN 'cod'
    WHEN amount_paid >= total THEN 'prepaid'
    ELSE 'partial'
  END`;
