import { NextResponse } from "next/server";
import { PANEL_COOKIE } from "@/lib/panelAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(PANEL_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
