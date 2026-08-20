import type { PanelOrder } from "./types";

/**
 * Order-specific formatting. The date/time/money helpers are shared with the
 * rest of the panel — see app/panel/_lib/datetime.ts for why they are pinned
 * to IST and why the clock time is always printed.
 */
export { fmtDateTime, fmtDate, fmtTime, fmtRelative, fmtMoney } from "@/app/panel/_lib/datetime";

/** Rupees the courier still has to collect. Never negative. */
export function balanceDue(order: PanelOrder): number {
  return Math.max(0, Number(order.total ?? 0) - Number(order.amountPaid ?? 0));
}

/**
 * What kind of payment this is, decided by the MONEY, not by the method name:
 * nothing collected = COD, the full total = prepaid, anything in between =
 * part paid online with the balance on delivery.
 */
export function paymentLabel(order: PanelOrder): {
  text: string;
  tone: "green" | "amber" | "blue" | "neutral";
} {
  const total = Number(order.total ?? 0);
  const paid = Number(order.amountPaid ?? 0);
  const online = String(order.paymentMethod ?? "cod").toLowerCase() !== "cod";

  if (paid <= 0) return online ? { text: "Online · unpaid", tone: "amber" } : { text: "Cash on delivery", tone: "blue" };
  if (paid >= total) return { text: "Prepaid · paid", tone: "green" };
  return { text: "Partly paid", tone: "amber" };
}

/** Tone for an order status chip. */
export function statusTone(status: unknown): "green" | "amber" | "red" | "blue" | "neutral" {
  const s = String(status ?? "").toLowerCase();
  if (s === "cancelled" || s === "returned") return "red";
  if (s === "delivered") return "green";
  if (s === "pending") return "amber";
  if (s === "ndr") return "red";
  if (s === "shipped" || s === "out_for_delivery" || s === "processing" || s === "confirmed") return "blue";
  return "neutral";
}

/**
 * JSON columns arrive either already parsed or still as a string, depending on
 * the driver and on whether the row was written before the column was typed.
 * Everything that reads one goes through here so neither shape can throw.
 */
export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim() !== "") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}
