import { NextResponse } from "next/server";
import { normalizePhone } from "@/lib/phone";
import { getCustomerByPhone, getCustomerByEmail, createCustomer } from "@/lib/customerStore";
import { createCustomerToken, CUSTOMER_COOKIE, CUSTOMER_SESSION_MAX_AGE } from "@/lib/customerAuth";
import { clientIp } from "@/lib/clientIp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Register with mobile (primary) + optional email/password for email login. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = normalizePhone(body?.phone);
  const email = body?.email ? String(body.email).trim().toLowerCase() : "";
  const password = String(body?.password ?? "");

  if (!name || !phone) {
    return NextResponse.json({ success: false, message: "Name and a valid mobile number are required." }, { status: 422 });
  }
  if ((email || password) && password.length < 6) {
    return NextResponse.json({ success: false, message: "Password must be at least 6 characters." }, { status: 422 });
  }

  try {
    if (await getCustomerByPhone(phone)) {
      return NextResponse.json(
        { success: false, message: "An account with this mobile already exists. Please log in." },
        { status: 409 }
      );
    }
    if (email && (await getCustomerByEmail(email))) {
      return NextResponse.json({ success: false, message: "That email is already in use." }, { status: 409 });
    }

    await createCustomer({ phone, name, email: email || null, password: password || null, ip: clientIp(req) });

    // verified:false — registering does NOT prove phone ownership; the customer
    // must complete a mobile OTP before they can place an order.
    const token = createCustomerToken({ phone, name, verified: false });
    const res = NextResponse.json({
      success: true,
      message: "Account created! Verify your mobile with OTP to place orders.",
      customer: { phone, name, email: email || null, verified: false, createdAt: new Date().toISOString() },
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
    const e = err as { code?: string };
    if (e.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ success: false, message: "An account with this mobile or email already exists." }, { status: 409 });
    }
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR" || e.code === "ER_BAD_FIELD_ERROR") {
      return NextResponse.json({ success: false, message: "Accounts are not set up yet." }, { status: 503 });
    }
    if (e.code === "ER_ACCESS_DENIED_ERROR" || e.code === "ECONNREFUSED") {
      // Server-side DB config problem (PANEL_DB_* env) — not the customer's fault.
      console.error("[auth/register] DB unreachable:", e.code);
      return NextResponse.json(
        { success: false, message: "Sign-up is temporarily unavailable. Please try again in a few minutes." },
        { status: 503 }
      );
    }
    console.error("[auth/register] error:", err);
    return NextResponse.json({ success: false, message: "Could not create account. Please try again." }, { status: 500 });
  }
}
