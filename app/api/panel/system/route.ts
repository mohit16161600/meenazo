import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool, PANEL_DB, isPanelInstalled } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import { isEasyEcomConfigured, getHoldHours, getEasyEcomUrl, easyEcomUrlProblem } from "@/lib/easyecom";
import { MAX_ATTEMPTS } from "@/lib/easyecomDispatch";
import { isSmsConfigured, isAisensyConfigured } from "@/lib/smsProvider";
import { isRazorpayConfigured } from "@/lib/razorpay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * System health aggregate — the panel "System status" page (ADMIN-ONLY).
 * Reports what is configured/working and what is broken: DB, EasyEcom
 * (API URL, token expiry, dispatch queue), WhatsApp OTP, Razorpay and the
 * signing secrets. Only ever reports PRESENCE/expiry of a secret — never the
 * value itself.
 */

type CheckStatus = "ok" | "warn" | "error";
interface Check {
  label: string;
  status: CheckStatus;
  message: string;
}
interface Group {
  title: string;
  checks: Check[];
}

const env = (k: string): string => (process.env[k] ?? "").trim();

/** Decode a JWT's exp + issuer (no verification — we only read our own tokens). */
function jwtExpiry(
  token: string
): { exp?: Date; expired?: boolean; daysLeft?: number; issuerHost?: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()
    ) as { exp?: number; iss?: string };
    let issuerHost: string | undefined;
    try {
      if (payload.iss) issuerHost = new URL(payload.iss).host;
    } catch {
      /* iss isn't a URL */
    }
    if (!payload.exp) return { issuerHost };
    const exp = new Date(payload.exp * 1000);
    const daysLeft = Math.floor((exp.getTime() - Date.now()) / 86_400_000);
    return { exp, expired: exp.getTime() < Date.now(), daysLeft, issuerHost };
  } catch {
    return null;
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

const fmt = (d: Date) =>
  d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** Token presence + JWT-expiry check shared by EasyEcom / AiSensy. */
function tokenCheck(label: string, value: string, missingMsg: string): Check {
  if (!value) return { label, status: "error", message: missingMsg };
  const info = jwtExpiry(value);
  if (info === null) return { label, status: "warn", message: "Set, but not a readable JWT — expiry unknown." };
  if (!info.exp) return { label, status: "ok", message: "Set. Token has no expiry date." };
  if (info.expired)
    return { label, status: "error", message: `EXPIRED on ${fmt(info.exp)} — generate a fresh token and update the env.` };
  if ((info.daysLeft ?? 99) <= 14)
    return { label, status: "warn", message: `Expires in ${info.daysLeft} days (${fmt(info.exp)}) — renew it soon.` };
  return { label, status: "ok", message: `Valid till ${fmt(info.exp)} (${info.daysLeft} days left).` };
}

function secretCheck(label: string, value: string, fallbackNote?: string): Check {
  if (!value) {
    return {
      label,
      status: "warn",
      message: fallbackNote ?? "Not set — add a long random string to the server env.",
    };
  }
  if (/change-?me|dev-secret|default/i.test(value)) {
    return { label, status: "warn", message: "Using a default/dev value — change it to a long random string." };
  }
  if (value.length < 24) {
    return { label, status: "warn", message: "Set, but short — use at least 32 random characters." };
  }
  return { label, status: "ok", message: "Set (strong)." };
}

export async function GET() {
  const denied = await requireAccess("system");
  if (denied) return denied;

  const groups: Group[] = [];
  const now = new Date().toISOString();
  const pool = getPanelPool();

  /* ---------------- Database ---------------- */
  const db: Check[] = [];
  let dbUp = false;
  try {
    await pool.query("SELECT 1");
    dbUp = true;
    db.push({
      label: "MySQL connection",
      status: "ok",
      message: `Connected — ${PANEL_DB.database} @ ${PANEL_DB.host}.`,
    });
  } catch (err) {
    const e = err as { code?: string };
    db.push({
      label: "MySQL connection",
      status: "error",
      message: `Cannot connect (${e.code ?? "unknown error"}) — check PANEL_DB_* in the server env. Login, orders and OTP are all DOWN until this works.`,
    });
  }
  if (dbUp) {
    db.push(
      (await isPanelInstalled())
        ? { label: "Tables installed", status: "ok", message: "Panel tables exist." }
        : { label: "Tables installed", status: "error", message: "Tables missing — open /panel/setup and run setup." }
    );
  }
  groups.push({ title: "Database", checks: db });

  /* ---------------- EasyEcom (order fulfillment) ---------------- */
  const ee: Check[] = [];
  const eeRawUrl = env("EASYECOM_API_URL");
  const eeUrl = getEasyEcomUrl(); // normalised + validated
  const urlProblem = easyEcomUrlProblem();
  ee.push(
    !eeRawUrl
      ? {
          label: "API URL",
          status: "error",
          message: "EASYECOM_API_URL is empty — orders are captured locally but NEVER pushed to EasyEcom.",
        }
      : urlProblem
        ? { label: "API URL", status: "error", message: `${urlProblem} Currently: ${eeRawUrl.slice(0, 120)}` }
        : { label: "API URL", status: "ok", message: eeUrl }
  );
  const eeToken = env("EASYECOM_API_TOKEN");
  ee.push(tokenCheck("API token", eeToken, "EASYECOM_API_TOKEN is empty — pushing is disabled."));

  // A token minted by host A is rejected (401/403) by host B — the commonest
  // cause of "orders never reach EasyEcom" even though everything looks set.
  // Skipped when the URL itself is unusable (that's already reported above).
  const issuerHost = eeToken ? jwtExpiry(eeToken)?.issuerHost : undefined;
  if (eeUrl && issuerHost) {
    const urlHost = hostOf(eeUrl);
    ee.push(
      urlHost === issuerHost
        ? { label: "Endpoint ↔ token match", status: "ok", message: `Both use ${issuerHost}.` }
        : {
            label: "Endpoint ↔ token match",
            status: "error",
            message: `MISMATCH — API URL points at ${urlHost ?? "an invalid URL"} but the token was issued by ${issuerHost}. Pushes will fail with 401/403. Change EASYECOM_API_URL to use ${issuerHost}.`,
          }
    );
  }
  ee.push({
    label: "Push status",
    status: isEasyEcomConfigured() ? "ok" : "error",
    message: isEasyEcomConfigured()
      ? `Enabled — orders push ${getHoldHours()}h after being placed (auto-check every 10 min).`
      : "DISABLED — fill both API URL and token, then restart the app.",
  });
  ee.push(secretCheck("Dispatch secret (EASYECOM_DISPATCH_SECRET)", env("EASYECOM_DISPATCH_SECRET")));
  ee.push(secretCheck("Webhook secret (EASYECOM_WEBHOOK_SECRET)", env("EASYECOM_WEBHOOK_SECRET")));

  if (dbUp) {
    try {
      const [q] = await pool.query<RowDataPacket[]>(
        "SELECT " +
          "COALESCE(SUM(easyecom_synced = 0 AND status <> 'cancelled'), 0) AS queued, " +
          "COALESCE(SUM(easyecom_synced = 0 AND status <> 'cancelled' AND (dispatch_at IS NULL OR dispatch_at <= ?)), 0) AS due, " +
          "COALESCE(SUM(easyecom_synced = 1), 0) AS synced, " +
          "COALESCE(SUM(easyecom_synced = 0 AND status <> 'cancelled' AND easyecom_error IS NOT NULL), 0) AS failing, " +
          "COALESCE(SUM(easyecom_synced = 0 AND status <> 'cancelled' AND easyecom_attempts >= ?), 0) AS capped " +
          "FROM `orders`",
        [now, MAX_ATTEMPTS]
      );
      const queued = Number(q[0]?.queued ?? 0);
      const due = Number(q[0]?.due ?? 0);
      const synced = Number(q[0]?.synced ?? 0);
      const failing = Number(q[0]?.failing ?? 0);
      const capped = Number(q[0]?.capped ?? 0);
      ee.push({
        label: "Order queue",
        status: failing > 0 ? "error" : due > 0 && !isEasyEcomConfigured() ? "warn" : "ok",
        message: `${synced} pushed · ${queued} waiting (${due} due now) · ${failing} failing.`,
      });
      // An order past the retry cap is INVISIBLE to auto-dispatch — it silently
      // stops being retried, so it must be surfaced or it waits forever.
      if (capped > 0) {
        ee.push({
          label: "Stuck — retry limit reached",
          status: "error",
          message: `${capped} order(s) hit ${MAX_ATTEMPTS} failed attempts, so auto-dispatch NO LONGER retries them. Fix the cause, then open the order and press "Push to EasyEcom now" (or use the dashboard's send button) — those ignore the limit.`,
        });
      }
      if (failing > 0) {
        const [errs] = await pool.query<RowDataPacket[]>(
          "SELECT order_number, easyecom_error FROM `orders` " +
            "WHERE easyecom_synced = 0 AND easyecom_error IS NOT NULL ORDER BY updated_at DESC LIMIT 3"
        );
        for (const r of errs) {
          ee.push({
            label: `Order ${String(r.order_number)}`,
            status: "error",
            message: String(r.easyecom_error).slice(0, 300),
          });
        }
      }
    } catch {
      ee.push({
        label: "Order queue",
        status: "warn",
        message: "Could not read queue stats (orders table missing dispatch columns — place one order or re-run setup).",
      });
    }
  }
  groups.push({ title: "EasyEcom — order fulfillment", checks: ee });

  /* ---------------- Customer login / OTP ---------------- */
  const otp: Check[] = [];
  if (isAisensyConfigured()) {
    otp.push(
      tokenCheck("AiSensy WhatsApp key", env("AISENSY_API_KEY"), "")
    );
    otp.push({
      label: "WhatsApp campaign",
      status: "ok",
      message: env("AISENSY_CAMPAIGN_NAME") || "meenazo_authentication_code (default)",
    });
  } else {
    otp.push({
      label: "AiSensy WhatsApp key",
      status: "error",
      message: "AISENSY_API_KEY is empty — OTP WhatsApp will NOT send; customers cannot log in or order.",
    });
  }
  otp.push({
    label: "SMS fallback",
    status: "ok",
    message: isSmsConfigured() ? "Configured." : "Not configured (optional — WhatsApp is the primary channel).",
  });
  if (dbUp) {
    try {
      const [last] = await pool.query<RowDataPacket[]>(
        "SELECT created_at, channel FROM `otp_codes` ORDER BY created_at DESC LIMIT 1"
      );
      otp.push({
        label: "Last OTP issued",
        status: "ok",
        message: last[0]
          ? `${String(last[0].created_at)} via ${String(last[0].channel)}.`
          : "No OTP sent yet.",
      });
    } catch {
      otp.push({ label: "Last OTP issued", status: "warn", message: "otp_codes table missing — re-run setup." });
    }
  }
  groups.push({ title: "Customer login / OTP", checks: otp });

  /* ---------------- Payments ---------------- */
  groups.push({
    title: "Payments",
    checks: [
      {
        label: "Razorpay",
        status: "ok",
        message: isRazorpayConfigured()
          ? "Online payments enabled."
          : "Not configured — checkout runs Cash-on-Delivery only (add keys to enable online payment).",
      },
    ],
  });

  /* ---------------- Security ---------------- */
  groups.push({
    title: "Security",
    checks: [
      secretCheck(
        "Customer session secret (CUSTOMER_SESSION_SECRET)",
        env("CUSTOMER_SESSION_SECRET"),
        "Not set — falling back to PANEL_SESSION_SECRET. Works, but give it its own strong value."
      ),
      secretCheck("Panel session secret (PANEL_SESSION_SECRET)", env("PANEL_SESSION_SECRET")),
    ],
  });

  const flat = groups.flatMap((g) => g.checks);
  return NextResponse.json({
    success: true,
    checkedAt: now,
    errors: flat.filter((c) => c.status === "error").length,
    warnings: flat.filter((c) => c.status === "warn").length,
    groups,
  });
}
