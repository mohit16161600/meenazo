import { NextResponse } from "next/server";
import { applyEasyEcomWebhook } from "@/lib/easyecomWebhook";

/**
 * EasyEcom status webhook receiver.
 * ---------------------------------------------------------------------------
 * EasyEcom POSTs order/shipment status updates here (shipped, out for delivery,
 * delivered, cancelled, NDR, RTO/returned, tracking/AWB, courier, …). Each is
 * matched to our order by the reference we sent (mpl####), stored in full, and
 * surfaced to the admin panel + the customer's order history.
 *
 * Configure the webhook URL in EasyEcom as:
 *   https://<your-domain>/api/easyecom/webhook?secret=<EASYECOM_WEBHOOK_SECRET>
 * (the secret can also be sent as an `x-webhook-secret` header). Requests
 * without a matching secret are rejected.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = (process.env.EASYECOM_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return false; // must be configured to accept webhooks
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") ?? url.searchParams.get("secret") ?? "";
  return provided === secret;
}

export async function POST(req: Request) {
  if (!(process.env.EASYECOM_WEBHOOK_SECRET ?? "").trim()) {
    return NextResponse.json(
      { success: false, message: "Webhook not configured (set EASYECOM_WEBHOOK_SECRET)." },
      { status: 503 }
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }

  try {
    const results = await applyEasyEcomWebhook(body);
    const matched = results.filter((r) => r.matched).length;
    // Always 200 so EasyEcom doesn't hammer retries for an order we don't have.
    return NextResponse.json({ success: true, received: results.length, matched, results });
  } catch (err) {
    console.error("[easyecom/webhook] error:", err);
    return NextResponse.json({ success: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
