import { NextResponse } from "next/server";
import { lookupEdd, isValidPincode } from "@/lib/edd";
import { isCodEnabled } from "@/lib/codRules";
import { getSiteConfig } from "@/lib/panelSettings";
import { hitLimit } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

/**
 * Delivery estimate for one pincode — what the product page's "Check delivery"
 * widget calls.
 *
 * Public and unauthenticated (a shopper has to be able to check before they
 * have an account), so it is throttled: every call reaches a third-party
 * courier database that also serves other sites on the same box, and an
 * un-throttled public endpoint in front of someone else's database is not ours
 * to hand out.
 *
 * COD availability is answered from the shop's OWN setting, not from the EDD
 * table — that table has no COD column, and the widget used to invent the
 * answer from the last digit of the pincode.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pincode = String(url.searchParams.get("pincode") ?? "").trim();

  if (!isValidPincode(pincode)) {
    return NextResponse.json(
      { success: false, message: "Enter a valid 6-digit pincode." },
      { status: 422 }
    );
  }

  // 30 checks a minute is far more than a person types and far less than a
  // script wants. Keyed by IP; a blocked caller gets Retry-After.
  const gate = hitLimit("edd", clientIp(req) || "unknown", {
    max: 30,
    windowMs: 60_000,
    blockMs: 60_000,
  });
  if (!gate.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many checks. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  const edd = await lookupEdd(pincode);

  // The shop-wide COD switch and cap live in the panel; the widget only needs
  // to know whether COD is on offer at all.
  let cod = true;
  try {
    cod = isCodEnabled(await getSiteConfig());
  } catch {
    /* a settings hiccup must not fail the delivery check */
  }

  return NextResponse.json({
    success: true,
    pincode,
    serviceable: edd.serviceable,
    /** True when we could not reach the courier data — NOT "we don't deliver". */
    unavailable: Boolean(edd.unavailable),
    minDays: edd.minDays,
    maxDays: edd.maxDays,
    warehouse: edd.warehouse,
    cod,
  });
}
