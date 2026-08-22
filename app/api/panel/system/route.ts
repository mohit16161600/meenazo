import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { getPanelPool, PANEL_DB, isPanelInstalled } from "@/lib/panelDb";
import { requireAccess } from "@/lib/panelCrud";
import {
  isEasyEcomConfigured,
  getHoldHours,
  getEasyEcomUrl,
  easyEcomUrlProblem,
  easyEcomUrlRewritten,
  CREATE_ORDER_PATH,
} from "@/lib/easyecom";
import { MAX_ATTEMPTS } from "@/lib/easyecomDispatch";
import { isSmsConfigured, isAisensyConfigured } from "@/lib/smsProvider";
import { isRazorpayConfigured, isRazorpayLiveMode } from "@/lib/razorpay";
import { isOrderWhatsappConfigured, orderCampaign } from "@/lib/orderNotify";
import { checkEddHealth } from "@/lib/edd";

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
  // The path is forced to the only one EasyEcom serves createOrder on, so a
  // stale env value no longer 404s — but say so, or the URL shown above won't
  // match what's in .env and the next person "fixes" it back.
  const rewritten = easyEcomUrlRewritten();
  if (eeUrl && rewritten) {
    ee.push({
      label: "API URL path",
      status: "warn",
      message: `EASYECOM_API_URL is set to "${rewritten}", which does not exist on EasyEcom (404). Calling ${CREATE_ORDER_PATH} instead — orders push fine, but fix the env value to match.`,
    });
  }
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

  // The exact URL to paste into EasyEcom's webhook settings, so it never has to
  // be reconstructed by hand (a wrong secret here fails silently as a 401).
  const wh = env("EASYECOM_WEBHOOK_SECRET");
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://meenazo.com").replace(/\/$/, "");
  ee.push(
    wh
      ? {
          label: "Status webhook URL (paste into EasyEcom)",
          status: "ok",
          // The secret is deliberately NOT printed. This page's whole rule is
          // presence-not-value, and a full URL with the live secret in it ends
          // up in browser history, screenshots and any response logging.
          message: `${site}/api/easyecom/webhook?secret=<EASYECOM_WEBHOOK_SECRET>  (paste the secret from your server env in place of the placeholder)`,
        }
      : {
          label: "Status webhook URL",
          status: "error",
          message: "EASYECOM_WEBHOOK_SECRET is empty — status updates from EasyEcom will be rejected.",
        }
  );

  if (dbUp) {
    try {
      const [w] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n, MAX(shipment_status_at) AS last FROM `orders` WHERE shipment_status_at IS NOT NULL"
      );
      const n = Number(w[0]?.n ?? 0);
      ee.push({
        label: "Status updates received",
        status: n > 0 ? "ok" : "warn",
        message:
          n > 0
            ? `${n} order(s) have courier status. Last update: ${String(w[0]?.last)}.`
            : "None yet — EasyEcom has not called the status webhook (or it isn't configured there yet).",
      });
    } catch {
      /* column may not exist on an old install */
    }
  }

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
      const channel = String(last[0]?.channel ?? "");
      // channel "dev" while a provider IS configured means the send was
      // ATTEMPTED and refused — the classic case is AiSensy running out of
      // WhatsApp Conversation Credits. Nobody can log in while this is true.
      const undelivered = channel === "dev" && isAisensyConfigured();
      otp.push({
        label: "Last OTP issued",
        status: undelivered ? "error" : "ok",
        message: !last[0]
          ? "No OTP sent yet."
          : undelivered
            ? `${String(last[0].created_at)} — NOT DELIVERED. WhatsApp is configured but the provider refused the send, so the code never reached the customer. Usual cause: AiSensy is out of WhatsApp Conversation Credits (top up), or the campaign is paused/unapproved. Check the server log for the exact reason.`
            : `${String(last[0].created_at)} via ${channel}.`,
      });
    } catch {
      otp.push({ label: "Last OTP issued", status: "warn", message: "otp_codes table missing — re-run setup." });
    }
  }
  groups.push({ title: "Customer login / OTP", checks: otp });

  /* ---------------- Payments ---------------- */
  const pay: Check[] = [];
  const keyId = env("RAZORPAY_KEY_ID") || env("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  pay.push({
    label: "Razorpay",
    status: isRazorpayConfigured() ? "ok" : "warn",
    message: isRazorpayConfigured()
      ? `Online payments enabled${isRazorpayLiveMode() ? " in LIVE mode — real money is charged" : " in TEST mode — no real money moves"}. All methods enabled in your Razorpay dashboard (UPI, cards, netbanking, wallets, EMI) are offered at checkout.`
      : "Not configured — checkout runs Cash-on-Delivery only (add keys to enable online payment).",
  });
  if (isRazorpayConfigured()) {
    // The browser needs the key id too; without it the online option is hidden
    // even though the server is perfectly configured.
    pay.push({
      label: "Browser key (NEXT_PUBLIC_RAZORPAY_KEY_ID)",
      status: env("NEXT_PUBLIC_RAZORPAY_KEY_ID") === keyId ? "ok" : "error",
      message:
        env("NEXT_PUBLIC_RAZORPAY_KEY_ID") === keyId
          ? "Matches RAZORPAY_KEY_ID."
          : "Missing or different from RAZORPAY_KEY_ID — the checkout page will hide the online-payment option. Set both to the same key id and rebuild.",
    });
  }
  const rzpWh = env("RAZORPAY_WEBHOOK_SECRET");
  pay.push(
    rzpWh
      ? {
          label: "Payment webhook URL (paste into Razorpay → Webhooks)",
          status: "ok",
          message: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://meenazo.com").replace(/\/$/, "")}/api/razorpay/webhook  ·  events: payment.captured, payment.failed, order.paid, refund.processed`,
        }
      : {
          label: "Payment webhook (RAZORPAY_WEBHOOK_SECRET)",
          status: "warn",
          message:
            "Not set — if a customer pays and closes the tab before the page returns, that PAID order stays 'pending'. Add the secret + webhook in the Razorpay dashboard.",
        }
  );
  pay.push({
    label: "WhatsApp order confirmation",
    status: isOrderWhatsappConfigured() ? "ok" : "warn",
    message: isOrderWhatsappConfigured()
      ? `Enabled — campaign "${orderCampaign()}" is sent once per order (COD and prepaid).`
      : "Not configured — customers get no confirmation message. Set AISENSY_API_KEY + AISENSY_ORDER_CAMPAIGN.",
  });
  if (dbUp) {
    try {
      const [wa] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS sent, MAX(whatsapp_sent_at) AS last FROM `orders` WHERE whatsapp_sent_at IS NOT NULL AND whatsapp_sent_at <> ''"
      );
      const [pending] = await pool.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS n FROM `orders` WHERE (whatsapp_sent_at IS NULL OR whatsapp_sent_at = '') AND status <> 'cancelled'"
      );
      const sent = Number(wa[0]?.sent ?? 0);
      const missing = Number(pending[0]?.n ?? 0);
      pay.push({
        label: "Confirmations sent",
        status: missing > 0 ? "warn" : "ok",
        message:
          `${sent} order(s) confirmed on WhatsApp` +
          (wa[0]?.last ? `, last ${String(wa[0].last)}` : "") +
          (missing > 0 ? ` · ${missing} order(s) still without a message (open the order → Resend WhatsApp).` : "."),
      });
    } catch {
      pay.push({
        label: "Confirmations sent",
        status: "warn",
        message: "Could not read the WhatsApp columns — place one order (they are added automatically) or re-run setup.",
      });
    }
  }
  groups.push({ title: "Payments", checks: pay });

  /* -------- Delivery estimate (ClickPost EDD) --------
     The product page's "Check delivery" widget can only tell a customer
     "unavailable". This says WHY — missing env, bad credentials, absent table
     or empty dataset are four different fixes, and without this the panel
     showed a clean bill of health while the widget was dead. */
  const eddChecks: Check[] = [];
  try {
    const h = await checkEddHealth();

    eddChecks.push(
      h.configured
        ? {
            label: "Configuration",
            status: "ok",
            message: `${h.user}@${h.host} · database ${h.database}`,
          }
        : {
            label: "Configuration",
            status: "error",
            message:
              "Not configured. Add EDD_DB_HOST, EDD_DB_PORT, EDD_DB_USER, EDD_DB_PASSWORD and " +
              "EDD_DB_NAME to the server's .env.local, then restart. Quote the password if it " +
              "contains a # — everything after an unquoted # is read as a comment.",
          }
    );

    if (h.configured) {
      eddChecks.push(
        h.connected
          ? { label: "Connection", status: "ok", message: `Connected to ${h.host}.` }
          : {
              label: "Connection",
              status: "error",
              message: `Cannot reach the EDD database: ${h.error ?? "unknown error"}`,
            }
      );

      if (h.connected) {
        eddChecks.push(
          h.rows > 0
            ? {
                label: "Pincode data",
                status: "ok",
                message: `${h.rows.toLocaleString("en-IN")} routes available.`,
              }
            : {
                label: "Pincode data",
                status: "error",
                message: "Connected, but the `edd` table is empty — no pincode can be quoted.",
              }
        );

        eddChecks.push(
          h.knownWarehouses.length > 0
            ? {
                label: "Warehouses found",
                status: "ok",
                message: h.knownWarehouses.join(", "),
              }
            : {
                label: "Warehouses found",
                status: "warn",
                message:
                  "No rows match the five configured pickup pincodes (110020, 421302, 711114, " +
                  "500078, 560015) — every lookup will read as not serviceable.",
              }
        );
      }
    }
  } catch (err) {
    eddChecks.push({
      label: "Delivery estimate",
      status: "error",
      message: `Health check failed: ${(err as Error)?.message ?? "unknown error"}`,
    });
  }
  groups.push({ title: "Delivery estimate (pincode checker)", checks: eddChecks });

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
