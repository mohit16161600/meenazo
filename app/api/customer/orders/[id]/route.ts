import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customerAuth";
import { getCustomerOrder } from "@/lib/customerOrders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/customer/orders/[id] — one order, scoped to the signed-in customer. */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Please log in." }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const order = await getCustomerOrder(session.phone, decodeURIComponent(id));
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("[customer/orders/:id] error:", err);
    return NextResponse.json({ success: false, message: "Could not load the order." }, { status: 500 });
  }
}
