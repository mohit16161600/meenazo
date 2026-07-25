import { NextResponse } from "next/server";
import { getSession } from "@/lib/panelAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({
    success: true,
    user: { id: session.uid, name: session.name, email: session.email, role: session.role },
  });
}
