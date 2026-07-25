/**
 * Normalize an Indian mobile number to canonical 10-digit form (the primary
 * customer key). Strips +91 / 0 prefixes and non-digits; rejects anything that
 * isn't a valid 10-digit mobile starting 6-9. Returns null when invalid.
 */
export function normalizePhone(raw: string | undefined | null): string | null {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length !== 10) return null;
  if (!/^[6-9]\d{9}$/.test(d)) return null;
  return d;
}
