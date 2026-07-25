import { NextResponse } from "next/server";

/**
 * Pincode → location lookup proxy.
 * ---------------------------------------------------------------------------
 * Thin server-side proxy over the Sheopals CRM pincode API so the browser
 * never calls the external host directly (avoids CORS + keeps the upstream URL
 * out of the client bundle). Given a 6-digit Indian PIN it returns the list of
 * post-office areas and the resolved state(s), normalized to a small shape the
 * checkout address form consumes.
 *
 * Response (always 200): { pincode, areas: [{ name, district }], states: string[], error? }
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPSTREAM = "https://sheopalscrm.in/api/data/pincodes";

export interface PincodeArea {
  name: string;
  district: string;
}

interface UpstreamRow {
  name?: unknown;
  district?: unknown;
  state?: unknown;
}

const clean = (v: unknown) => String(v ?? "").trim();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pincode = (searchParams.get("pincode") || "").replace(/\D/g, "").slice(0, 6);

  if (pincode.length !== 6) {
    return NextResponse.json({ pincode, areas: [], states: [], error: "invalid_pincode" });
  }

  try {
    const upstream = await fetch(`${UPSTREAM}?pincode=${pincode}`, {
      headers: { Accept: "application/json" },
      // Pincode → area mappings are effectively static; cache for a day.
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return NextResponse.json({ pincode, areas: [], states: [], error: "upstream_error" });
    }

    const json = (await upstream.json()) as { data?: unknown };
    const rows: UpstreamRow[] = Array.isArray(json?.data) ? (json.data as UpstreamRow[]) : [];

    const areas: PincodeArea[] = rows
      .map((r) => ({ name: clean(r.name), district: clean(r.district) }))
      .filter((a) => a.name);
    const states = [...new Set(rows.map((r) => clean(r.state)).filter(Boolean))];

    return NextResponse.json({ pincode, areas, states });
  } catch {
    return NextResponse.json({ pincode, areas: [], states: [], error: "upstream_error" });
  }
}
