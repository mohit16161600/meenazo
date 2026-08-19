import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getSession } from "@/lib/panelAuth";
import { canAccess } from "@/lib/panelRoles";
import { dispatchDueOrders } from "@/lib/easyecomDispatch";

/**
 * EasyEcom dispatch trigger.
 * ---------------------------------------------------------------------------
 * Pushes every order past its hold window to EasyEcom. Called by:
 *   • an external cron (cPanel / Windows Task) — authorize with the secret:
 *       POST /api/easyecom/dispatch?secret=<EASYECOM_DISPATCH_SECRET>
 *   • the panel "Send to EasyEcom now" button — a logged-in admin session.
 *
 * Pass ?force=1 to ignore the 3h hold and push all eligible orders immediately
 * (panel button only — the secret path always respects the hold unless forced).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorize(req: Request, allowSession: boolean): Promise<boolean> {
  // 1) A logged-in admin with orders access — POST only. The panel cookie is
  //    SameSite=Lax, which IS sent on a top-level GET navigation, so honouring
  //    the session on GET would let a link emailed to a signed-in admin
  //    force-dispatch every held order and defeat the hold window.
  if (allowSession) {
    const session = await getSession();
    if (session && canAccess(session.role, "orders")) return true;
  }

  // 2) A matching dispatch secret (for headless cron). Constant-time compare.
  const secret = (process.env.EASYECOM_DISPATCH_SECRET ?? "").trim();
  if (!secret) return false;
  const url = new URL(req.url);
  const provided = (
    req.headers.get("x-dispatch-secret") ?? url.searchParams.get("secret") ?? ""
  ).trim();
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function run(req: Request, allowSession: boolean) {
  if (!(await authorize(req, allowSession))) {
    return NextResponse.json({ success: false, message: "Not authorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";
  try {
    const report = await dispatchDueOrders({ force });
    return NextResponse.json({ success: true, report });
  } catch (err) {
    console.error("[easyecom/dispatch] failed:", err);
    return NextResponse.json({ success: false, message: "Dispatch failed." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return run(req, true);
}

// GET is allowed so a plain cron URL (no body) works — but ONLY with the
// secret, never on the strength of a panel cookie. See authorize().
export async function GET(req: Request) {
  return run(req, false);
}
