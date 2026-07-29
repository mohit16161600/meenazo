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
