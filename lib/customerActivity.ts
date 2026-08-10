import { MODELS } from "./panelModels";
import { insertRow } from "./panelCrud";

/**
 * Customer activity trail — "kaun customer kab kya kiya".
 * ---------------------------------------------------------------------------
 * One row per meaningful customer action, keyed by phone (the primary customer
 * identity), stored in `customer_activity` and shown in the panel's Customers
 * section: logins (with time), account creation, OTP requests, wishlist
 * add/remove, cart updates, orders placed, online payments, profile edits.
 *
 * Logging must NEVER break the customer-facing flow: any DB error here is
 * swallowed (logged to the server console only).
 */

export type CustomerActivityAction =
  | "login"
  | "register"
  | "otp_requested"
  | "wishlist_add"
  | "wishlist_remove"
  | "cart_update"
  | "order_placed"
  | "payment_success"
  | "profile_update";

export async function logCustomerActivity(
  phone: string,
  action: CustomerActivityAction,
  details?: Record<string, unknown> | null,
  ip?: string | null
): Promise<void> {
  try {
    await insertRow(MODELS.customerActivity, {
      phone,
      action,
      details: details ?? null,
      ip: ip ?? null,
    });
  } catch (err) {
    console.error(`[activity] log "${action}" failed:`, (err as Error)?.message);
  }
}
