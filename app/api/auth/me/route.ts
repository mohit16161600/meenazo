import { NextResponse } from "next/server";
import { getCustomerSession, CUSTOMER_COOKIE } from "@/lib/customerAuth";
import { getCustomerByPhone, toPublicCustomer } from "@/lib/customerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current signed-in customer (or null). Used by the client AuthContext on load. */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ success: true, customer: null });
  try {
    const row = await getCustomerByPhone(session.phone);
    if (!row) {
      // The account no longer exists in the DB — a stale cookie must not keep
      // the browser "logged in". Clear it so the UI asks for a fresh login.
      const res = NextResponse.json({ success: true, customer: null });
      res.cookies.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
      return res;
    }
    return NextResponse.json({ success: true, customer: toPublicCustomer(row) });
  } catch {
    // DB hiccup — fall back to the session data so a transient error doesn't
    // log everyone out. Order routes re-check the DB themselves anyway.
    return NextResponse.json({
      success: true,
      customer: {
        phone: session.phone,
        name: session.name,
        email: null,
        verified: session.verified,
        createdAt: null,
      },
    });
  }
}
