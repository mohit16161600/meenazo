import type { RowDataPacket } from "mysql2";
import { getEddPool, isEddConfigured } from "./eddDb";

/**
 * Estimated delivery for a customer's pincode.
 * ---------------------------------------------------------------------------
 * The `edd` table holds one row per (pickup_pincode, drop_pincode) with a
 * min/max day range from ClickPost. Meenazo ships from five warehouses, so a
 * single drop pincode has up to five answers and one of them has to be chosen.
 *
 * WE QUOTE THE FASTEST. That is the promise a customer sees on the product
 * page, and it is only honest as long as fulfilment really does dispatch from
 * whichever warehouse is nearest. If stock ever consolidates into one
 * location, set EDD_PICKUP_PINCODE to that warehouse and this narrows to it —
 * quoting Bangalore's two days while shipping from Delhi would be a broken
 * promise on every order.
 */

/** The five dispatch warehouses, keyed by pickup pincode. */
export const WAREHOUSES: Record<string, string> = {
  "110020": "Delhi",
  "421302": "Mumbai",
  "711114": "Kolkata",
  "500078": "Hyderabad",
  "560015": "Bangalore",
};

/**
 * Restrict the lookup to one warehouse by setting EDD_PICKUP_PINCODE. Unset
 * (the normal case) means "consider all five and take the fastest".
 */
function pickupList(): string[] {
  const pinned = (process.env.EDD_PICKUP_PINCODE ?? "").trim();
  if (pinned && WAREHOUSES[pinned]) return [pinned];
  return Object.keys(WAREHOUSES);
}

export interface EddResult {
  /** A row was found — we can name a delivery window. */
  serviceable: boolean;
  minDays: number;
  maxDays: number;
  /** Which warehouse won the race, for support and debugging. */
  warehouse: string | null;
  pickupPincode: string | null;
  /**
   * The lookup itself could not run (env missing, database down). Distinct
   * from `serviceable: false`, which is a real answer — this one means we do
   * not know, and the UI must not tell the customer they are unserviceable.
   */
  unavailable?: boolean;
}

const NOT_SERVICEABLE: EddResult = {
  serviceable: false,
  minDays: 0,
  maxDays: 0,
  warehouse: null,
  pickupPincode: null,
};

/** Six digits, and Indian pincodes never start with 0. */
export function isValidPincode(value: unknown): boolean {
  return /^[1-9]\d{5}$/.test(String(value ?? "").trim());
}

/** Read a day count that may arrive as a string, a decimal, or junk. */
function days(value: unknown): number {
  const n = Math.ceil(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Fastest delivery window to `dropPincode`, or a not-serviceable answer.
 *
 * One query, not five: the pickups go in an IN list and MySQL returns the best
 * row directly. Ordered by the MAX first — the window a customer is actually
 * promised — so a tight "3-4 days" wins over a vague "2-9 days".
 */
export async function lookupEdd(dropPincode: string): Promise<EddResult> {
  if (!isValidPincode(dropPincode)) return NOT_SERVICEABLE;
  if (!isEddConfigured()) return { ...NOT_SERVICEABLE, unavailable: true };

  const pool = getEddPool();
  if (!pool) return { ...NOT_SERVICEABLE, unavailable: true };

  const pickups = pickupList();
  const placeholders = pickups.map(() => "?").join(", ");

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pickup_pincode, edd_min, edd_max FROM \`edd\`
        WHERE drop_pincode = ? AND pickup_pincode IN (${placeholders})
          AND edd_max IS NOT NULL AND edd_max > 0
        ORDER BY edd_max ASC, edd_min ASC
        LIMIT 1`,
      [String(dropPincode).trim(), ...pickups]
    );

    const row = rows[0];
    if (!row) return NOT_SERVICEABLE;

    const maxDays = days(row.edd_max);
    if (!maxDays) return NOT_SERVICEABLE;
    // A missing or nonsensical min just collapses to the max, so the UI shows
    // "in 4 days" rather than an impossible "0-4 days".
    const minDays = Math.min(days(row.edd_min) || maxDays, maxDays);
    const pickup = String(row.pickup_pincode ?? "");

    return {
      serviceable: true,
      minDays,
      maxDays,
      warehouse: WAREHOUSES[pickup] ?? null,
      pickupPincode: pickup || null,
    };
  } catch (err) {
    // A courier database being down must never look like "we don't deliver
    // there" — the customer would leave over an outage on our side.
    console.error("[edd] lookup failed:", (err as Error)?.message);
    return { ...NOT_SERVICEABLE, unavailable: true };
  }
}
