import type { SiteConfig } from "@/types";

/**
 * Cash-on-Delivery availability rules — ONE implementation, shared by the
 * browser and the server.
 * ---------------------------------------------------------------------------
 * One master switch and two rules decide whether COD is on offer:
 *
 *   0. Master switch — `codEnabled` off means no COD at all, at any value.
 *   1. Order value   — above `codMaxOrderValue` the order must be prepaid.
 *   2. Cooldown      — one COD order per number per `codCooldownMinutes`.
 *
 * The checkout uses these helpers to grey the COD card out BEFORE the customer
 * fills the form; the server enforces them again (lib/orderCapture.ts for the
 * value cap, /api/cod for the cooldown) because the browser is never trusted.
 *
 * This file is imported by client components — keep it free of Node-only code.
 */

type CodConfig = Pick<SiteConfig, "codMaxOrderValue" | "codCooldownMinutes" | "codEnabled">;

/**
 * Is Cash on Delivery offered at all? The owner's master switch (panel →
 * Settings → Payment options) sits ABOVE the two rules below: off means no COD
 * order can be placed at any value, by anyone.
 *
 * Absent means ON — an install that predates the switch (or a published
 * snapshot that hasn't been re-published yet) must not silently lose COD.
 */
export function isCodEnabled(config: Partial<CodConfig>): boolean {
  return config.codEnabled !== false;
}

/** Why COD is unavailable when the owner has switched it off. */
export function codDisabledMessage(): string {
  return "Cash on Delivery is currently unavailable. Please pay online to place your order.";
}

/** Highest COD-payable total in ₹ (0 = no cap). */
export function codMaxOrderValue(config: Partial<CodConfig>): number {
  const max = Number(config.codMaxOrderValue ?? 0);
  if (!Number.isFinite(max) || max <= 0) return 0;
  return Math.floor(max);
}

/** Gap enforced between two COD orders on one number, in minutes (0 = off). */
export function codCooldownMinutes(config: Partial<CodConfig>): number {
  const mins = Number(config.codCooldownMinutes ?? 0);
  if (!Number.isFinite(mins) || mins <= 0) return 0;
  return Math.floor(mins);
}

/** True when an order of this payable amount is still allowed to be COD. */
export function isCodAmountAllowed(orderTotal: number, config: Partial<CodConfig>): boolean {
  const limit = codMaxOrderValue(config);
  if (limit === 0) return true;
  return Math.max(0, Math.round(Number(orderTotal) || 0)) <= limit;
}

/**
 * Minutes still to wait before this number may place another COD order.
 * `lastCodOrderAt` is the ISO timestamp of their previous COD order; anything
 * unparseable (or no previous order) means "no wait".
 */
export function codWaitMinutes(
  lastCodOrderAt: string | null | undefined,
  config: Partial<CodConfig>,
  now: number = Date.now()
): number {
  const cooldown = codCooldownMinutes(config);
  if (cooldown === 0 || !lastCodOrderAt) return 0;

  const last = Date.parse(String(lastCodOrderAt));
  if (!Number.isFinite(last)) return 0;

  const elapsedMs = now - last;
  // A clock skew / future timestamp must not lock the customer out forever.
  if (elapsedMs < 0 || elapsedMs >= cooldown * 60_000) return 0;
  return Math.max(1, Math.ceil((cooldown * 60_000 - elapsedMs) / 60_000));
}

/** "45 minutes" / "1 hour 5 minutes" — the wait, in words a customer reads. */
export function formatWait(minutes: number): string {
  const m = Math.max(0, Math.ceil(minutes));
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"}`;
  const hours = Math.floor(m / 60);
  const rest = m % 60;
  const h = `${hours} hour${hours === 1 ? "" : "s"}`;
  return rest === 0 ? h : `${h} ${rest} minute${rest === 1 ? "" : "s"}`;
}

/** Why COD is unavailable right now — the exact sentence shown at checkout. */
export function codAmountBlockedMessage(limit: number): string {
  return `COD is not available on orders above ₹${limit.toLocaleString("en-IN")}. Please pay online to place this order.`;
}

export function codCooldownBlockedMessage(minutesLeft: number): string {
  return `You've already placed a COD order recently. Please pay online, or try COD again in ${formatWait(minutesLeft)}.`;
}
