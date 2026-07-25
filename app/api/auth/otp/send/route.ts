import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { issueOtp } from "@/lib/otp";
import { clientIp } from "@/lib/clientIp";

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
  try {
    const r = await issueOtp(phone, clientIp(req));
    if (!r.ok) {
      return NextResponse.json({ success: false, message: r.message }, { status: 429 });
    }
    return NextResponse.json({
      success: true,
      message: r.channels === "dev" ? "OTP generated (dev mode)." : `OTP sent via ${r.channels}.`,
      channels: r.channels,
      devCode: r.devCode, // present only in dev / when no provider configured
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR") {
      return NextResponse.json(
        { success: false, message: "Accounts are not set up yet. Please run panel setup." },
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
