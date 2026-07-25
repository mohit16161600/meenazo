import { isIP } from "node:net";

/**
 * Best-effort client IP from proxy headers, validated so a spoofed header can't
 * pollute stored data. Requires nginx/CDN to set X-Forwarded-For / X-Real-IP
 * (else returns "0.0.0.0"). Shared by the order-capturing API routes.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const candidates = [
    req.headers.get("cf-connecting-ip"),
    xff ? xff.split(",")[0]?.trim() : null,
    req.headers.get("x-real-ip"),
  ];
  for (const c of candidates) {
    if (c && isIP(c) !== 0) return c;
  }
  return "0.0.0.0";
}
