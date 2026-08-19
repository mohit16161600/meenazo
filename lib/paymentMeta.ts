import { siteConfig } from "@/data/site";

/**
 * What we tell the payment gateway about an order.
 * ---------------------------------------------------------------------------
 * A payment sitting in the gateway dashboard as a bare amount is useless when
 * something goes wrong: the owner has to match it back to an order by hand.
 * So every payment carries the whole story with it — our order id and MPL
 * number, who placed it, where it ships, what is in it, and where it came
 * from — and support can answer "whose payment is this?" from the gateway
 * screen alone, without opening the panel.
 *
 * Kept gateway-neutral on purpose: Razorpay is the only one wired up today,
 * but the next one gets the same detail by calling this same builder.
 *
 * Razorpay's limit is 15 note fields, each value at most 256 characters — the
 * caps below are enforced here rather than trusted to the caller, because
 * going over makes the ENTIRE order-create call fail (i.e. no payment at all).
 */

/** Razorpay accepts at most 15 notes; other gateways are no more generous. */
const MAX_NOTES = 15;
const MAX_VALUE = 250;

/**
 * Tidy one note value. Symbols that read badly in a dashboard column are
 * folded to their ASCII equivalent and control characters are dropped, but
 * LETTERS ARE LEFT ALONE in every script — the whole point of these notes is
 * to say whose order this is, and stripping a customer's name down to
 * "Rakesh Kumr" (or to nothing at all) defeats that.
 */
function safeText(value: string): string {
  return value
    .replace(/[₹]/g, "Rs ")
    .replace(/[×✕✖]/g, "x")
    .replace(/[–—]/g, "-")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Truncate to fit the gateway's per-note limit, counting BYTES: the cap is on
 * the encoded value, and one Devanagari character is three bytes, so a
 * character count would sail straight past it.
 */
function clip(value: string, maxBytes = MAX_VALUE): string {
  let out = value;
  while (out.length > 0 && Buffer.byteLength(out, "utf8") > maxBytes) out = out.slice(0, -1);
  return out;
}

/** Rupees as an ASCII amount: 4140 → "Rs 4140". */
const rupees = (value: number) => `Rs ${Math.round(Number(value) || 0)}`;

export interface GatewayNoteItem {
  name?: string;
  variant?: string | null;
  quantity?: number;
}

export interface GatewayNoteInput {
  /** Our internal row id — the webhook reads this back to find the order. */
  orderId: string;
  /** The human order number (MPL0007). */
  orderNumber: string;
  customerName: string;
  /** The OTP-verified account number the order was placed against. */
  accountPhone: string;
  /** Delivery contact, when the customer typed a different one. */
  deliveryPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  items: GatewayNoteItem[];
  couponCode?: string | null;
  /** Instant pay-online discount included in `total`. */
  prepaidDiscount?: number;
  /** Rupees the gateway is being asked to charge. */
  total: number;
  /** Where the order came from — "website", a campaign, a phone order… */
  source?: string;
}

/** "Slimpax (2 Bottles) x2 + Joshveda x1" — trimmed to fit one note. */
export function itemsSummary(items: GatewayNoteItem[], limit = MAX_VALUE): string {
  const parts = items.map((i) => {
    const name = safeText(String(i.name ?? "")) || "item";
    const variant = safeText(String(i.variant ?? ""));
    return `${name}${variant ? ` (${variant})` : ""} x${Math.max(1, Number(i.quantity ?? 1))}`;
  });

  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const next = out ? `${out} + ${parts[i]}` : parts[i];
    if (next.length > limit) {
      // Say how many didn't fit rather than cutting a product name mid-word.
      const rest = parts.length - i;
      const tail = ` +${rest} more`;
      return out ? `${out.slice(0, limit - tail.length)}${tail}` : parts[0].slice(0, limit);
    }
    out = next;
  }
  return out;
}

/** Human label for where the order was placed, for the gateway dashboard. */
function sourceLabel(source?: string): string {
  const s = String(source ?? "").trim() || "website";
  return s.toLowerCase() === "website" ? `${siteConfig.name} website - checkout` : s;
}

/**
 * Build the gateway's `notes` map. Empty fields are dropped, values are
 * truncated, and the whole thing is capped at MAX_NOTES entries — the earlier
 * a field appears below, the more likely it is to survive that cap.
 *
 * `orderId` and `orderNumber` come first and are never dropped: the webhook
 * resolves our order from `notes.orderId`, so losing it would orphan a real
 * payment.
 */
export function buildGatewayNotes(input: GatewayNoteInput): Record<string, string> {
  const delivery = String(input.deliveryPhone ?? "").trim();
  const account = String(input.accountPhone ?? "").trim();

  const candidates: [string, string | number | null | undefined][] = [
    ["orderId", input.orderId],
    ["orderNumber", input.orderNumber],
    ["customer", input.customerName],
    ["phone", account],
    // Only worth a note when it differs — otherwise it's a wasted field.
    ["deliveryPhone", delivery && delivery !== account ? delivery : null],
    ["email", input.email],
    ["city", input.city],
    ["state", input.state],
    ["pincode", input.pincode],
    ["address", input.address],
    ["items", itemsSummary(input.items)],
    ["coupon", input.couponCode],
    [
      "prepaidDiscount",
      Number(input.prepaidDiscount ?? 0) > 0 ? `-${rupees(Number(input.prepaidDiscount))}` : null,
    ],
    ["amount", rupees(input.total)],
    ["source", sourceLabel(input.source)],
  ];

  const notes: Record<string, string> = {};
  for (const [key, raw] of candidates) {
    if (Object.keys(notes).length >= MAX_NOTES) break;
    const value = safeText(String(raw ?? ""));
    if (!value) continue;
    notes[key] = clip(value);
  }
  return notes;
}
