import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { verifyOtp, tooManyVerifyAttempts } from "@/lib/otp";
import { upsertCustomerOnOtp, getCustomerByPhone, toPublicCustomer } from "@/lib/customerStore";
import { createCustomerToken, CUSTOMER_COOKIE, CUSTOMER_SESSION_MAX_AGE } from "@/lib/customerAuth";
import { clientIp } from "@/lib/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = normalizePhone(body?.phone);
  const code = String(body?.code ?? "").trim();
  if (!phone || !/^\d{4,8}$/.test(code)) {
    return NextResponse.json({ success: false, message: "Enter the code sent to your phone." }, { status: 422 });
  }

  // Cap attempts so the code can't be brute-forced inside its validity window.
  if (tooManyVerifyAttempts(phone)) {
    return NextResponse.json(
      { success: false, message: "Too many attempts. Please request a new OTP." },
      { status: 429 }
    );
  }

  try {
    const ok = await verifyOtp(phone, code);
    if (!ok) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP." }, { status: 401 });
    }

    const name = body?.name ? String(body.name) : undefined;
    await upsertCustomerOnOtp(phone, name, clientIp(req));
    const row = await getCustomerByPhone(phone);

    // verified:true — the phone was just proven via OTP (required to order).
    const token = createCustomerToken({
      phone,
      name: row?.name ? String(row.name) : name ?? "",
      verified: true,
    });
    const res = NextResponse.json({
      success: true,
      message: "Verified.",
      customer: row
        ? toPublicCustomer(row)
        : { phone, name: name ?? "", email: null, verified: true, createdAt: null },
    });
    res.cookies.set(CUSTOMER_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: CUSTOMER_SESSION_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error("[otp/verify] error:", err);
    return NextResponse.json({ success: false, message: "Verification failed. Please try again." }, { status: 500 });
  }
}
