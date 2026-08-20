/**
 * Turning a `YYYY-MM-DD` filter into the UTC instants it means.
 * ---------------------------------------------------------------------------
 * Timestamps are stored as ISO-8601 UTC strings, and the panel filters compare
 * them as strings — which is chronologically correct as long as both sides are
 * in the same `…Z` format.
 *
 * The trap is the DAY. A date picked in the panel means an INDIAN day, but
 * pasting it straight into `${date}T00:00:00.000Z` means a UTC day, and the two
 * are 5½ hours apart. "From today" then silently skipped every order placed
 * between midnight and 5:30 am IST — the quietest hours of the night, but real
 * orders all the same, and nothing on screen said they were missing.
 *
 * So the boundaries are built at the IST offset and converted, which lands
 * exactly on 18:30Z the previous day.
 */

const IST_OFFSET = "+05:30";

/** Start of that Indian calendar day, as a UTC ISO string. */
export function istDayStart(date: string): string {
  const d = new Date(`${date}T00:00:00.000${IST_OFFSET}`);
  // A malformed date must not become `Invalid Date` in a SQL parameter; fall
  // back to the literal UTC reading, which is what this used to do anyway.
  return Number.isNaN(d.getTime()) ? `${date}T00:00:00.000Z` : d.toISOString();
}

/** End of that Indian calendar day (inclusive), as a UTC ISO string. */
export function istDayEnd(date: string): string {
  const d = new Date(`${date}T23:59:59.999${IST_OFFSET}`);
  return Number.isNaN(d.getTime()) ? `${date}T23:59:59.999Z` : d.toISOString();
}

/**
 * Which Indian day a stored timestamp falls on — `YYYY-MM-DD`.
 *
 * Reporting used to bucket with `createdAt.slice(0, 10)`, which reads the UTC
 * day off the front of the string. Every order placed between midnight and 5:30
 * am IST was therefore counted on the PREVIOUS day, quietly moving sales
 * between two bars of the chart (and, on the 1st of a month, between two rows
 * of the month table).
 *
 * `en-CA` is used purely because it formats as `YYYY-MM-DD`.
 */
export function istDayKey(value: unknown): string {
  const d = value instanceof Date ? value : new Date(String(value ?? ""));
  if (Number.isNaN(d.getTime())) return String(value ?? "").slice(0, 10);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

/** Which Indian month a stored timestamp falls in — `YYYY-MM`. */
export function istMonthKey(value: unknown): string {
  return istDayKey(value).slice(0, 7);
}
