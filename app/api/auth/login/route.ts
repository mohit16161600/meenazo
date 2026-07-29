import { NextResponse } from "next/server";
import { getCustomerByEmail, touchCustomerLogin, toPublicCustomer } from "@/lib/customerStore";
import { createCustomerToken, CUSTOMER_COOKIE, CUSTOMER_SESSION_MAX_AGE } from "@/lib/customerAuth";
import { hitLimit, clearAttempts, LOGIN_LIMIT } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { constantTimeEquals } from "@/lib/secureCompare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Optional secondary login for customers who set an email + password. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 422 });
  }

  // Same brute-force protection as the admin panel login.
  const throttleKey = `${clientIp(req) ?? "?"}:${email}`;
  const gate = hitLimit("customer-login", throttleKey, LOGIN_LIMIT);
  if (!gate.allowed) {
    return NextResponse.json(
      {
        success: false,
        message: `Too many failed attempts. Please try again in ${Math.ceil(gate.retryAfterSec / 60)} minute(s), or sign in with a mobile OTP.`,
      },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  try {
    const row = await getCustomerByEmail(email);
    if (!row || !row.password || !constantTimeEquals(password, String(row.password))) {
      return NextResponse.json({ success: false, message: "Invalid email or password." }, { status: 401 });
    }
    clearAttempts("customer-login", throttleKey);
    await touchCustomerLogin(String(row.phone));

    // Carry the customer's OTP-verified status into the session; email login
    // alone does NOT confer verified — they must have proven the phone via OTP.
    const token = createCustomerToken({
      phone: String(row.phone),
      name: String(row.name ?? ""),
      verified: Boolean(Number(row.verified)),
    });
    const res = NextResponse.json({ success: true, message: "Welcome back!", customer: toPublicCustomer(row) });
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
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR") {
      return NextResponse.json({ success: false, message: "Accounts are not set up yet." }, { status: 503 });
    }
    console.error("[auth/login] error:", err);
    return NextResponse.json({ success: false, message: "Login failed. Please try again." }, { status: 500 });
  }
}
