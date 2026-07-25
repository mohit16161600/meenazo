import { NextResponse } from "next/server";
import { runSetup } from "@/lib/panelSchema";
import { isPanelInstalled } from "@/lib/panelDb";
import { getSession } from "@/lib/panelAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const installed = await isPanelInstalled();
  return NextResponse.json({ success: true, installed });
}

export async function POST() {
  try {
    // First install is open (there is nothing to protect yet), but RE-running
    // setup on an installed panel (migrations/reseed) requires an admin session
    // — an anonymous caller must not be able to trigger installer behaviour.
    let installed = false;
    try {
      installed = await isPanelInstalled();
    } catch {
      /* DB unreachable/broken counts as not installed — allow the installer */
    }
    if (installed) {
      const session = await getSession();
      if (!session || session.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Panel is already installed. Log in as an administrator to re-run setup." },
          { status: 401 }
        );
      }
    }
    const report = await runSetup();
    return NextResponse.json({ success: true, report });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[panel setup] failed:", err);
    let hint = e.message ?? "Setup failed.";
    if (e.code === "ECONNREFUSED")
      hint =
        "Could not connect to MySQL. Start MySQL in the XAMPP Control Panel and try again.";
    if (e.code === "ER_ACCESS_DENIED_ERROR")
      hint =
        "MySQL access denied. Check PANEL_DB_USER / PANEL_DB_PASSWORD in .env.local (XAMPP default is user 'root' with an empty password).";
    return NextResponse.json({ success: false, message: hint, code: e.code }, { status: 500 });
  }
}
