import { randomInt } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { getPanelPool } from "./panelDb";
import { MODELS } from "./panelModels";
import { insertRow } from "./panelCrud";
import { deliverOtp, isSmsConfigured, isWhatsappConfigured } from "./smsProvider";

/**
 * OTP issue/verify. Every code is stored in the `otp_codes` table (owner can
 * read it), delivered over SMS + WhatsApp when configured, and in dev the code
 * is also returned so the flow works before any provider keys exist.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RATE_WINDOW_MS = 60 * 1000; // max N sends per phone per minute
const RATE_MAX = 3;
const isDev = process.env.NODE_ENV !== "production";

function genCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export interface IssueResult {
  ok: boolean;
  message?: string;
  channels: string; // e.g. "sms+whatsapp" or "dev"
  devCode?: string; // only in non-production
  retryAfterMs?: number;
}

/** Issue a login OTP for a (already-normalized) phone. */
export async function issueOtp(phone: string, ip?: string): Promise<IssueResult> {
  const pool = getPanelPool();

  // Rate limit: cap sends per phone per window.
  try {
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS n FROM `otp_codes` WHERE phone = ? AND created_at >= ?",
      [phone, since]
    );
    if (Number(rows[0]?.n ?? 0) >= RATE_MAX) {
      return { ok: false, message: "Too many OTP requests. Please wait a minute and try again.", channels: "", retryAfterMs: RATE_WINDOW_MS };
    }
  } catch {
    /* if the rate check fails (table missing), fall through — setup will create it */
  }

  // Invalidate any still-live codes for this phone so at most ONE OTP is ever
  // valid — otherwise the per-guess odds degrade as unconsumed codes pile up.
  try {
    await pool.query("UPDATE `otp_codes` SET consumed = 1 WHERE phone = ? AND consumed = 0", [phone]);
  } catch {
    /* table may not exist yet on first run */
  }

  const code = genCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  // Store FIRST, deliver after. If the DB write fails the customer must not
  // receive a code that can never verify (they'd get the OTP on WhatsApp yet
  // see "could not send" — and verification would always fail).
  const intended =
    [isSmsConfigured() && "sms", isWhatsappConfigured() && "whatsapp"]
      .filter(Boolean)
      .join("+") || "dev";
  const row = await insertRow(MODELS.otpCodes, {
    phone,
    code,
    channel: intended,
    purpose: "login",
    expiresAt,
    consumed: false,
    ip: ip ?? null,
  });

  const delivered = await deliverOtp(phone, code);
  const sentChannels = delivered.filter((d) => d.sent).map((d) => d.channel);
  const channels = sentChannels.length ? sentChannels.join("+") : "dev";
  if (channels !== intended) {
    // Audit only — record what actually went out.
    try {
      await pool.query("UPDATE `otp_codes` SET channel = ? WHERE id = ?", [channels, row.id]);
    } catch {
      /* non-fatal */
    }
  }

  return {
    ok: true,
    channels,
    // Show the code only when no real provider is configured (dev/testing).
    devCode: isDev && !(isSmsConfigured() || isWhatsappConfigured()) ? code : undefined,
  };
}

/**
 * Per-phone verify-attempt cap (in-memory; the app runs as a single pm2
 * instance). Blocks brute-forcing the 6-digit code within its 10-min window.
 */
const verifyAttempts = new Map<string, { count: number; resetAt: number }>();
const VERIFY_MAX = 8;

export function tooManyVerifyAttempts(phone: string): boolean {
  const now = Date.now();
  const rec = verifyAttempts.get(phone);
  if (!rec || rec.resetAt < now) {
    verifyAttempts.set(phone, { count: 1, resetAt: now + OTP_TTL_MS });
    return false;
  }
  rec.count += 1;
  return rec.count > VERIFY_MAX;
}

/** Verify a code for a phone; consumes the matching row on success. */
export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const pool = getPanelPool();
  const now = new Date().toISOString();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM `otp_codes` WHERE phone = ? AND code = ? AND consumed = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1",
    [phone, String(code).trim(), now]
  );
  const row = rows[0];
  if (!row) return false;
  await pool.query("UPDATE `otp_codes` SET consumed = 1 WHERE id = ?", [row.id]);
  return true;
}
