import { NextResponse } from "next/server";
import { requireVerifiedCustomer } from "@/lib/customerAuth";
import { listCustomerOrders } from "@/lib/customerOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/customer/orders — the signed-in customer's real orders, newest first. */
export async function GET() {
  const gate = await requireVerifiedCustomer();
  if (!gate.ok) {
    const { ok, status, ...rest } = gate;
    void ok;
    return NextResponse.json({ success: false, ...rest }, { status });
  }
  try {
    const orders = await listCustomerOrders(gate.phone);
    return NextResponse.json({ success: true, orders });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "ER_NO_SUCH_TABLE" || e.code === "ER_BAD_DB_ERROR") {
      return NextResponse.json({ success: true, orders: [] });
    }
    console.error("[customer/orders] list error:", err);
    return NextResponse.json({ success: false, message: "Could not load your orders." }, { status: 500 });
  }
}
