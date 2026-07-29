import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Storefront customer session — a stateless HMAC-signed cookie, phone-keyed.
 * Separate from the admin panel session (PANEL_COOKIE). No external deps.
 * PHONE is the primary identity across the whole customer data model.
 */

export const CUSTOMER_COOKIE = "meenazo_customer";

/**
 * Resolve the signing secret LAZILY (per call) so an empty env value can't
 * silently produce an empty HMAC key. `??` would treat "" (a set-but-blank env
 * var, as shipped in .env files) as present and skip the fallbacks, signing
 * every token with an empty, forgeable key. We instead trim + pick the first
 * NON-EMPTY value, and fail closed in production rather than fall back to a
 * publicly-known default. (Resolved lazily, not at module load, so `next build`
 * — which runs with NODE_ENV=production but never executes these routes — stays
 * green; only real requests enforce it.)
 */
function getSecret(): string {
  const found = [process.env.CUSTOMER_SESSION_SECRET, process.env.PANEL_SESSION_SECRET]
    .map((s) => (s ?? "").trim())
    .find((s) => s.length > 0);
  if (found) return found;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "CUSTOMER_SESSION_SECRET (or PANEL_SESSION_SECRET) must be set to a strong random value in production."
    );
  }
  return "meenazo-customer-insecure-default-secret-dev-only";
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const CUSTOMER_SESSION_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);

/**
 * Token format version. Every issued cookie embeds this; verification rejects
 * any other value. Bumping it instantly invalidates ALL previously-issued
 * customer cookies (old logins), forcing a fresh sign-in — without touching
 * the DB or rotating the secret.
 */
const TOKEN_VERSION = 2;

export interface CustomerSession {
  /** Token format version — must equal TOKEN_VERSION or the token is dead. */
  v?: number;
  phone: string;
  name: string;
  /** true only when the phone was proven via OTP (required to place orders). */
  verified: boolean;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}
function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", getSecret()).update(payloadB64).digest());
}

export function createCustomerToken(data: Omit<CustomerSession, "exp" | "v">): string {
  const payload: CustomerSession = { ...data, v: TOKEN_VERSION, exp: Date.now() + SESSION_TTL_MS };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifyCustomerToken(token: string | undefined): CustomerSession | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(fromB64url(payloadB64).toString()) as CustomerSession;
    // Old-format tokens (no/lower `v`) are dead — the customer must log in again.
    if (data.v !== TOKEN_VERSION) return null;
    if (!data.exp || data.exp < Date.now() || !data.phone) return null;
    data.verified = Boolean(data.verified);
    return data;
  } catch {
    return null;
  }
}

/** Read + verify the customer session from request cookies (server side). */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  const store = await cookies();
  return verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
}
