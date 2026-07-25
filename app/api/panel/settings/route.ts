import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/panelCrud";
import { getSiteConfig, saveSiteConfig } from "@/lib/panelSettings";
import type { SiteConfig } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAccess("settings");
  if (denied) return denied;
  const config = await getSiteConfig();
  return NextResponse.json({ success: true, config });
}

export async function PUT(req: Request) {
  const denied = await requireAccess("settings");
  if (denied) return denied;
  let body: SiteConfig;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  try {
    // merge on top of current so partial saves keep existing keys
    const current = await getSiteConfig();
    await saveSiteConfig({ ...current, ...body });
    return NextResponse.json({ success: true, config: { ...current, ...body } });
  } catch (err) {
    console.error("[panel settings] save failed:", err);
    return NextResponse.json({ success: false, message: "Could not save settings." }, { status: 500 });
  }
}
