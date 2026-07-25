import {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { cookies } from "next/headers";
import { PANEL_COOKIE } from "./panelConstants";

/**
 * Self-contained admin auth for the panel — no external deps.
 *  - Passwords: scrypt with a per-user random salt, stored as `scrypt$salt$hash`.
 *  - Sessions:  stateless signed cookie  base64url(payload).hmacSHA256 .
 */

export { PANEL_COOKIE };

/**
 * Lazy secret resolution: a set-but-empty PANEL_SESSION_SECRET (as `??` treats
 * "" as present) must NOT become an empty HMAC key. Trim + require non-empty,
 * fail closed in production instead of falling back to a known default.
 * Resolved per call so `next build` stays green.
 */
function getSecret(): string {
  const found = (process.env.PANEL_SESSION_SECRET ?? "").trim();
  if (found) return found;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PANEL_SESSION_SECRET must be set to a strong random value in production.");
  }
  return "meenazo-panel-insecure-default-secret-dev-only";
}
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/* ----------------------------- Passwords ----------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return (
      derived.length === expected.length && timingSafeEqual(derived, expected)
    );
  } catch {
    return false;
  }
}

/**
 * Check a login attempt against a user row. Prefers the plaintext `password`
 * column (the owner keeps passwords readable in the DB/panel); falls back to
 * the scrypt `passwordHash` for older rows that only have a hash. Comparison is
 * constant-time either way.
 */
export function passwordMatches(
  input: string,
  user: { password?: unknown; passwordHash?: unknown }
): boolean {
  const plain = user.password;
  if (plain != null && String(plain).length > 0) {
    const a = Buffer.from(input);
    const b = Buffer.from(String(plain));
    return a.length === b.length && timingSafeEqual(a, b);
  }
  if (user.passwordHash) return verifyPassword(input, String(user.passwordHash));
  return false;
}

/* ----------------------------- Sessions ----------------------------- */

export interface SessionData {
  uid: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function sign(payloadB64: string): string {
  return b64url(createHmac("sha256", getSecret()).update(payloadB64).digest());
}

export function createSessionToken(
  user: Omit<SessionData, "exp">
): string {
  const payload: SessionData = { ...user, exp: Date.now() + SESSION_TTL_MS };
  const payloadB64 = b64url(Buffer.from(JSON.stringify(payload)));
  return `${payloadB64}.${sign(payloadB64)}`;
}

export function verifySessionToken(token: string | undefined): SessionData | null {
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  const expected = sign(payloadB64);
  // constant-time compare of signatures
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(fromB64url(payloadB64).toString()) as SessionData;
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

/** Read + verify the session from the request cookies (server side). */
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  return verifySessionToken(store.get(PANEL_COOKIE)?.value);
}

export const SESSION_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);
