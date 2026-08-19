/**
 * In-memory login throttle (no external deps, no Redis).
 * ---------------------------------------------------------------------------
 * The app runs as a single pm2 instance, so a process-local map is an accurate
 * counter. Used to stop password brute-forcing on the admin panel and the
 * customer email login — without it an attacker can try unlimited passwords
 * against a known account at full network speed.
 *
 * Counting is per (scope, key) where key is usually `${ip}:${identifier}` so one
 * abusive IP can't lock every customer out, and one targeted account can't be
 * hammered from a single host either.
 */

interface Bucket {
  count: number;
  resetAt: number;
  /** Set once the bucket trips, so the block lasts a fixed cool-down. */
  blockedUntil?: number;
}

const buckets = new Map<string, Bucket>();

/** Drop expired buckets so the map can't grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 5000) return;
  for (const [k, b] of buckets) {
    if ((b.blockedUntil ?? b.resetAt) < now) buckets.delete(k);
  }
}

export interface ThrottleOptions {
  /** Attempts allowed inside the window before the cool-down kicks in. */
  max: number;
  /** Rolling window in ms. */
  windowMs: number;
  /** How long to refuse further attempts once tripped. */
  blockMs: number;
}

export interface ThrottleResult {
  allowed: boolean;
  /** Seconds the caller should wait — for the Retry-After header. */
  retryAfterSec: number;
  remaining: number;
}

/**
 * Register one attempt. Call BEFORE checking the password; call
 * `clearAttempts` after a successful login so honest users are never punished
 * for an earlier typo.
 */
export function hitLimit(
  scope: string,
  key: string,
  opts: ThrottleOptions
): ThrottleResult {
  const now = Date.now();
  sweep(now);
  const id = `${scope}:${key}`;
  const b = buckets.get(id);

  if (b?.blockedUntil && b.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  if (!b || b.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, retryAfterSec: 0, remaining: opts.max - 1 };
  }

  b.count += 1;
  if (b.count > opts.max) {
    b.blockedUntil = now + opts.blockMs;
    return {
      allowed: false,
      retryAfterSec: Math.ceil(opts.blockMs / 1000),
      remaining: 0,
    };
  }
  return { allowed: true, retryAfterSec: 0, remaining: opts.max - b.count };
}

/** Wipe the counter for a key — call on a successful authentication. */
export function clearAttempts(scope: string, key: string): void {
  buckets.delete(`${scope}:${key}`);
}

/** Sensible defaults for an interactive login form. */
export const LOGIN_LIMIT: ThrottleOptions = {
  max: 8,
  windowMs: 10 * 60 * 1000, // 10 minutes
  blockMs: 15 * 60 * 1000, // 15 minute cool-down once tripped
};

/**
 * The per-ACCOUNT ceiling. Looser than the per-(ip, account) one because a real
 * person may legitimately fumble their password from a couple of devices, but
 * it is the bucket that actually holds: see hitLoginLimit.
 */
export const ACCOUNT_LOGIN_LIMIT: ThrottleOptions = {
  max: 12,
  windowMs: 10 * 60 * 1000,
  blockMs: 15 * 60 * 1000,
};

/**
 * Register one login attempt against BOTH buckets.
 *
 * The (ip, account) bucket alone was not a defence: the IP comes from
 * `x-forwarded-for`, which the client sends and nginx merely appends to — so
 * incrementing a fake IP per request minted a fresh bucket every time and the
 * throttle never tripped. The account-only bucket cannot be escaped that way,
 * because the thing being attacked IS the account.
 *
 * Keeping both means one abusive IP still can't lock every customer out.
 */
export function hitLoginLimit(
  scope: string,
  ip: string | null | undefined,
  account: string
): ThrottleResult {
  const byAccount = hitLimit(`${scope}-acct`, account, ACCOUNT_LOGIN_LIMIT);
  if (!byAccount.allowed) return byAccount;
  return hitLimit(scope, `${ip ?? "?"}:${account}`, LOGIN_LIMIT);
}

/** Clear both login buckets — call after a successful authentication. */
export function clearLoginLimit(scope: string, ip: string | null | undefined, account: string): void {
  clearAttempts(`${scope}-acct`, account);
  clearAttempts(scope, `${ip ?? "?"}:${account}`);
}

/**
 * OTP sending costs real money (AiSensy bills per conversation) and is fully
 * unauthenticated. The per-phone cap in lib/otp.ts stops one number being
 * spammed; these stop one source walking the whole number space, and put an
 * absolute ceiling on what a bad hour can cost.
 */
export const OTP_IP_LIMIT: ThrottleOptions = {
  max: 10,
  windowMs: 60 * 1000,
  blockMs: 10 * 60 * 1000,
};

/**
 * Site-wide ceiling — the only bucket an attacker rotating both IPs and phone
 * numbers cannot escape, so it is what actually bounds the bill.
 *
 * 30/minute is many times a 3-product store's real peak while capping a bad
 * hour at 1,800 sends instead of an open tap. The cool-down is deliberately
 * short: if a genuine rush ever trips it, login recovers within the minute
 * rather than staying down.
 */
export const OTP_GLOBAL_LIMIT: ThrottleOptions = {
  max: 30,
  windowMs: 60 * 1000,
  blockMs: 60 * 1000,
};
