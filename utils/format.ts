import { siteConfig } from "@/data/site";

/** Format a number as Indian Rupee currency (no decimals for whole values). */
export function formatPrice(amount: number, withSymbol = true): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(rounded);
  return withSymbol ? `${siteConfig.currencySymbol}${formatted}` : formatted;
}

/** Percentage discount between an original and sale price. */
export function discountPercent(price: number, salePrice?: number | null): number {
  if (!salePrice || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

/** The effective price a customer pays. */
export function effectivePrice(price: number, salePrice?: number | null): number {
  return salePrice && salePrice < price ? salePrice : price;
}

/** Human-friendly date, e.g. "22 Jun 2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "2 days ago" style relative time. */
export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return "";
  const diff = Date.now() - d;
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/** Truncate text to a length with an ellipsis. */
export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}
