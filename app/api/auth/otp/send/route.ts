import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { issueOtp } from "@/lib/otp";
import { clientIp } from "@/lib/clientIp";
import { hitLimit, OTP_IP_LIMIT, OTP_GLOBAL_LIMIT } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(body?.phone);
  if (!phone) {
    return NextResponse.json(
      { success: false, message: "Enter a valid 10-digit mobile number." },
      { status: 422 }
    );
  }
  // Every send costs money (AiSensy bills per conversation) and this route is
  // unauthenticated. issueOtp already caps sends PER NUMBER; these two cap the
  // caller and the site, so nobody can walk the number space and run up the
  // bill — or SMS-bomb strangers from the brand's sender.
  const ip = clientIp(req);
  const perIp = hitLimit("otp-send-ip", ip ?? "?", OTP_IP_LIMIT);
  const global = perIp.allowed ? hitLimit("otp-send", "all", OTP_GLOBAL_LIMIT) : perIp;
  if (!global.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many OTP requests right now. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, global.retryAfterSec)) } }
    );
  }

  try {
    const r = await issueOtp(phone, ip);
    if (!r.ok) {
      // 429 = asked too often · 503 = we couldn't hand it to the provider at all
      // (the customer can retry, but the OWNER has to fix something).
      return NextResponse.json(
        { success: false, message: r.message, devCode: r.devCode },
        { status: r.code === "not_delivered" ? 503 : 429 }
      );
    }
    return NextResponse.json({
      success: true,
      message: r.channels === "dev" ? "OTP generated (dev mode)." : `OTP sent via ${r.channels}.`,
      channels: r.channels,
      devCode: r.devCode, // present only in dev / when no provider configured
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR" || e.code === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json(
        { success: false, message: "Accounts are not set up yet. Please run panel setup." },
        { status: 503 }
      );
    }
    if (e.code === "ER_ACCESS_DENIED_ERROR" || e.code === "ECONNREFUSED") {
      // Server-side DB config problem (PANEL_DB_* env) — not the customer's fault.
      console.error("[otp/send] DB unreachable:", e.code);
      return NextResponse.json(
        { success: false, message: "Login is temporarily unavailable. Please try again in a few minutes." },
        { status: 503 }
      );
    }
    console.error("[otp/send] error:", err);
    return NextResponse.json(
      { success: false, message: "Could not send OTP. Please try again." },
      { status: 500 }
    );
  }
}
