import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { getCustomerByPhone, toPublicCustomer } from "@/lib/customerStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Current signed-in customer (or null). Used by the client AuthContext on load. */
export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ success: true, customer: null });
  try {
    const row = await getCustomerByPhone(session.phone);
    return NextResponse.json({
      success: true,
      customer: row
        ? toPublicCustomer(row)
        : { phone: session.phone, name: session.name, email: null, verified: true, createdAt: null },
    });
  } catch {
    // DB hiccup — fall back to the trusted session data so the user stays logged in.
    return NextResponse.json({
      success: true,
      customer: { phone: session.phone, name: session.name, email: null, verified: true, createdAt: null },
    });
  }
}
