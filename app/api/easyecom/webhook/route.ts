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
 * The secret may instead ride in an auth header (see `authorized`). Requests
 * carrying none of them are rejected.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Accept the shared secret however EasyEcom chooses to send it.
 *
 * Their webhook config offers an "Auth Type / Auth-Token" pair, but which
 * header that lands in varies by account and trigger, so we check every common
 * carrier — query string, custom headers, and `Authorization` (with or without
 * a `Bearer `/`Token ` prefix). Any ONE of them matching is enough; a request
 * with none is rejected.
 */
function authorized(req: Request): boolean {
  const secret = (process.env.EASYECOM_WEBHOOK_SECRET ?? "").trim();
  if (!secret) return false; // must be configured to accept webhooks

  const url = new URL(req.url);
  const auth = (req.headers.get("authorization") ?? "").trim();
  const candidates = [
    url.searchParams.get("secret"),
    url.searchParams.get("token"),
    url.searchParams.get("api_token"),
    req.headers.get("x-webhook-secret"),
    req.headers.get("x-api-key"),
    req.headers.get("access-token"),
    req.headers.get("accesstoken"),
    req.headers.get("api-token"),
    auth,
    auth.replace(/^(Bearer|Token)\s+/i, ""),
  ];
  return candidates.some((c) => (c ?? "").trim() === secret);
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
    // Still 200 — and for the same reason as the line above. A non-2xx makes
    // EasyEcom retry this delivery for days, so a transient DB fault would
    // turn into a retry storm. It is logged loudly instead; the next status
    // update (or the panel) reconciles the order.
    console.error("[easyecom/webhook] error:", err);
    return NextResponse.json({ success: true, handled: false, message: "Logged." });
  }
}
