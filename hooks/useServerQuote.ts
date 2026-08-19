"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/types";

/**
 * The server's price for the current cart.
 * ---------------------------------------------------------------------------
 * useCartSummary is a good ESTIMATE — it prices from the published snapshot and
 * from whatever each line cost when it was added to the cart. Neither is
 * guaranteed to still be true: the owner may have changed a price, deactivated
 * a coupon or edited the prepaid percent without pressing Publish, and a cart
 * can sit in localStorage for weeks.
 *
 * So checkout shows THIS instead. Same arithmetic the order routes run, so the
 * number on the button is the number that gets charged.
 */

export interface ServerQuote {
  subtotal: number;
  discount: number;
  couponCode: string | null;
  prepaidDiscount: number;
  shipping: number;
  total: number;
  codTotal: number;
  prepaidSaving: number;
  prepaidPercent: number;
  couponBlocked: "prepaid" | "cod" | null;
  codAmountAllowed: boolean;
  codMaxOrderValue: number;
  /** Owner's master switches, live from the panel DB (no Publish needed). */
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  freeShippingThreshold: number;
  skipped: string[];
  lines: { slug: string; variant: string | null; quantity: number; price: number; lineTotal: number }[];
}

export interface QuoteState {
  quote: ServerQuote | null;
  /** True until the FIRST answer arrives — checkout waits for that one. */
  loading: boolean;
  /** The server couldn't price it (offline, or nothing orderable left). */
  error: string | null;
}

const DEBOUNCE_MS = 250;

export function useServerQuote(
  items: CartItem[],
  couponCode: string | undefined,
  paymentMethod: string | undefined
): QuoteState {
  const [state, setState] = useState<QuoteState>({ quote: null, loading: true, error: null });

  // Only the parts the server actually prices — re-quoting on an unrelated
  // re-render would put the checkout in a request loop.
  const key = JSON.stringify({
    i: items.map((i) => [i.slug, i.variant ?? "", i.quantity]),
    c: couponCode ?? "",
    m: paymentMethod ?? "",
  });

  const latest = useRef(0);

  useEffect(() => {
    const parsed = JSON.parse(key) as { i: [string, string, number][]; c: string; m: string };
    if (parsed.i.length === 0) {
      setState({ quote: null, loading: false, error: null });
      return;
    }

    const run = ++latest.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: parsed.i.map(([product, variant, quantity]) => ({
              product,
              variant: variant || undefined,
              quantity,
            })),
            coupon: parsed.c || undefined,
            paymentMethod: parsed.m || undefined,
          }),
          signal: controller.signal,
        });
        const data = (await res.json()) as { success?: boolean; quote?: ServerQuote; message?: string };
        // A slower earlier request must never overwrite a newer answer.
        if (run !== latest.current) return;
        if (data.success && data.quote) {
          setState({ quote: data.quote, loading: false, error: null });
        } else {
          setState({ quote: null, loading: false, error: data.message ?? "Could not price your cart." });
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
        if (run !== latest.current) return;
        // Keep whatever we last had rather than blanking the totals.
        setState((prev) => ({ ...prev, loading: false, error: "Could not reach the server to confirm prices." }));
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return state;
}
