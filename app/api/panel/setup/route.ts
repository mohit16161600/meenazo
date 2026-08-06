import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runSetup } from "@/lib/panelSchema";
import { isPanelInstalled } from "@/lib/panelDb";
import { getSession } from "@/lib/panelAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The installer. It creates tables, seeds content and can mint an admin
 * account — so it is the single most dangerous endpoint in the panel and is
 * treated as admin-only.
 *
 * It previously opened up whenever `isPanelInstalled()` was false, and a DB it
 * could not reach counted as "not installed". On a live site with a database
 * hiccup that made the installer anonymously callable. Access is now decided by
 * WHO is asking, never by the database's state.
 *
 * Two ways in, nothing else:
 *  1. A signed-in user whose role is exactly `admin` (not manager/editor/seo).
 *  2. First-boot only, when there is no admin to log in as yet: the
 *     `PANEL_SETUP_TOKEN` env value, sent as the `x-setup-token` header.
 *     Unset env = this path is closed.
 */

/** Constant-time compare that tolerates different lengths. */
function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type Gate = { ok: true } | { ok: false; status: number; message: string };

async function authorize(req: Request): Promise<Gate> {
  const session = await getSession();
  if (session) {
    if (session.role === "admin") return { ok: true };
    // A signed-in editor/seo/manager gets a flat no — and no hint that an
    // installer exists behind this URL.
    return { ok: false, status: 403, message: "Not available for your account." };
  }

  const expected = (process.env.PANEL_SETUP_TOKEN ?? "").trim();
  const provided = (req.headers.get("x-setup-token") ?? "").trim();
  if (expected && provided && tokenMatches(provided, expected)) return { ok: true };

  return { ok: false, status: 401, message: "Not authorised." };
}

export async function GET(req: Request) {
  const gate = await authorize(req);
  if (!gate.ok) {
    return NextResponse.json({ success: false, message: gate.message }, { status: gate.status });
  }

  try {
    return NextResponse.json({ success: true, installed: await isPanelInstalled() });
  } catch (err) {
    console.error("[panel setup] status check failed:", err);
    return NextResponse.json({ success: true, installed: false, reachable: false });
  }
}

export async function POST(req: Request) {
  const gate = await authorize(req);
  if (!gate.ok) {
    return NextResponse.json({ success: false, message: gate.message }, { status: gate.status });
  }

  try {
    const report = await runSetup();
    return NextResponse.json({ success: true, report });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    // Full detail (host, user, driver message) goes to the server log only.
    console.error("[panel setup] failed:", err);

    // What goes back over the wire names no host, user, env var or file — a
    // connection error must not become a map of the infrastructure.
    let hint = "Setup failed. Check the server logs for details.";
    if (e.code === "ECONNREFUSED" || e.code === "ETIMEDOUT" || e.code === "ENOTFOUND")
      hint = "Could not reach the database server.";
    if (e.code === "ER_ACCESS_DENIED_ERROR")
      hint = "The database rejected the configured credentials.";
    if (e.code === "ER_BAD_DB_ERROR") hint = "The configured database does not exist.";

    return NextResponse.json({ success: false, message: hint }, { status: 500 });
  }
}
