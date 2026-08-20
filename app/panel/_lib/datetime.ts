/**
 * Date, time and money formatting for the whole panel.
 * ---------------------------------------------------------------------------
 * Timestamps are stored as ISO-8601 UTC strings (datetime columns are
 * VARCHAR(40) — see lib/panelMap.ts). Two rules, and every screen follows them:
 *
 *   • Always print IST. Formatting in the browser's own zone would show a Delhi
 *     order in whatever zone the laptop happens to be in.
 *   • Always print the TIME, not just the date. "2026-08-19" doesn't answer
 *     "did this come in before or after the 3pm dispatch run?" — which is the
 *     question actually being asked of an order list.
 */

const IST = "Asia/Kolkata";

export function parseStamp(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "20 Aug 2026, 4:32 PM" */
export function fmtDateTime(value: unknown): string {
  const d = parseStamp(value);
  if (!d) return "—";
  return d.toLocaleString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** "20 Aug 2026" — for places where the clock time is noise. */
export function fmtDate(value: unknown): string {
  const d = parseStamp(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { timeZone: IST, day: "2-digit", month: "short", year: "numeric" });
}

/** "4:32 PM" — pairs with fmtDate on two lines in a dense table cell. */
export function fmtTime(value: unknown): string {
  const d = parseStamp(value);
  if (!d) return "";
  return d.toLocaleTimeString("en-IN", { timeZone: IST, hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * "2 hours ago" / "in 3 hours" — the hint that turns a timestamp into an
 * answer. Future times matter: the EasyEcom hold window is quoted as a future
 * `dispatch_at`, and "in 40 minutes" is exactly what the owner wants to know.
 */
export function fmtRelative(value: unknown): string {
  const d = parseStamp(value);
  if (!d) return "";
  const diff = d.getTime() - Date.now();
  const future = diff > 0;
  const mins = Math.round(Math.abs(diff) / 60000);

  if (mins < 1) return "just now";
  const say = (n: number, unit: string) =>
    future ? `in ${n} ${unit}${n === 1 ? "" : "s"}` : `${n} ${unit}${n === 1 ? "" : "s"} ago`;

  if (mins < 60) return say(mins, "minute");
  const hours = Math.round(mins / 60);
  if (hours < 24) return say(hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return say(days, "day");
  const months = Math.round(days / 30);
  if (months < 12) return say(months, "month");
  return say(Math.round(months / 12), "year");
}

/** "₹1,990" — whole rupees, Indian digit grouping. */
export function fmtMoney(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** `yyyy-mm-dd` for a date input, N days back from today (0 = today). IST. */
export function isoDaysAgo(days: number): string {
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: IST }));
  ist.setDate(ist.getDate() - days);
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  return `${ist.getFullYear()}-${m}-${d}`;
}
