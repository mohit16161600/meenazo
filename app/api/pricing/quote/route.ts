import { NextResponse } from "next/server";
import { priceCart } from "@/lib/orderCapture";

/**
 * What this cart ACTUALLY costs, decided by the server.
 * ---------------------------------------------------------------------------
 * The browser prices the cart from the published snapshot (data/*.ts) while the
 * server prices it from the panel DB. Those two drift the moment the owner
 * edits a price, a coupon or the prepaid percent and hasn't pressed Publish —
 * and a cart item keeps whatever price it had when it was added, possibly weeks
 * ago. The customer would then be shown one number and charged another.
 *
 * So the checkout asks here and displays THIS. The local estimate is only a
 * placeholder until the answer arrives. Nothing is written and no session is
 * required — it is the same arithmetic the order routes run, just without the
 * order, so it leaks nothing a visitor can't already see on the shop.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  items?: { product?: string; variant?: string; quantity?: number }[];
  coupon?: string;
  paymentMethod?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  // Same cap the cart itself enforces — this endpoint is unauthenticated.
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 100).map((i) => ({
    product: String(i.product ?? ""),
    variant: i.variant ? String(i.variant) : undefined,
    quantity: Number(i.quantity ?? 1),
  }));

  if (items.length === 0) {
    return NextResponse.json({ success: false, message: "Cart is empty." }, { status: 422 });
  }

  try {
    const q = await priceCart({
      items,
      coupon: body.coupon ? String(body.coupon) : undefined,
      paymentMethod: body.paymentMethod ? String(body.paymentMethod) : undefined,
    });

    return NextResponse.json({
      success: true,
      quote: {
        subtotal: q.subtotal,
        discount: q.priced.discount,
        couponCode: q.priced.couponCode,
        prepaidDiscount: q.priced.prepaidDiscount,
        shipping: q.priced.shipping,
        total: q.priced.total,
        codTotal: q.cod.total,
        prepaidSaving: q.prepaidSaving,
        prepaidPercent: q.prepaidPercent,
        couponBlocked: q.couponBlocked,
        codAmountAllowed: q.codAmountAllowed,
        codMaxOrderValue: q.codMaxOrderValue,
        // The owner's payment-method switches, read live from the panel DB —
        // so flipping one in the panel takes effect on the checkout at once,
        // without waiting for a Publish.
        codEnabled: q.codEnabled,
        onlinePaymentEnabled: q.onlinePaymentEnabled,
        freeShippingThreshold: q.freeShippingThreshold,
        /** Lines the server refused to price — unknown slug or unknown variety. */
        skipped: q.skipped,
        /** Per-line prices as the server sees them, so the cart can show drift. */
        lines: q.items.map((i) => ({
          slug: i.slug,
          variant: i.variant ?? null,
          quantity: i.quantity,
          price: i.price,
          lineTotal: i.lineTotal,
        })),
      },
    });
  } catch (err) {
    const e = err as { code?: string; skipped?: string[] };
    if (e.code === "NO_ITEMS") {
      return NextResponse.json(
        { success: false, message: "Nothing in this cart can be ordered right now.", skipped: e.skipped ?? [] },
        { status: 422 }
      );
    }
    console.error("[pricing/quote] failed:", err);
    return NextResponse.json({ success: false, message: "Could not price the cart." }, { status: 500 });
  }
}
