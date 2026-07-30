import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/panelCrud";
import { dispatchSingleOrder } from "@/lib/easyecomDispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Panel "Push to EasyEcom now" — force-push ONE order, ignoring the hold. */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAccess("orders");
  if (denied) return denied;

  const { id } = await params;
  try {
    const result = await dispatchSingleOrder(decodeURIComponent(id));
    return NextResponse.json(
      {
        success: result.ok,
        message: result.ok
          ? `Order ${result.orderNumber} pushed to EasyEcom${result.ref ? ` (ref ${result.ref})` : ""}.`
          : result.error,
        ...result,
      },
      { status: result.ok ? 200 : 422 }
    );
  } catch (err) {
    console.error("[panel orders/push] failed:", err);
    return NextResponse.json(
      { success: false, message: "Push failed. Please try again." },
      { status: 500 }
    );
  }
}
