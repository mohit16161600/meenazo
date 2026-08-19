"use client";

import { cn } from "@/utils/cn";
import type { PaymentMethod } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { formatPrice } from "@/utils/format";
import { isRazorpayEnabled, type RazorpayPreferredMethod } from "@/services/razorpayService";

/**
 * The online-payment options we open Razorpay with. Choosing one here simply
 * pre-selects that tab inside Razorpay's own modal (`prefill.method`) — the
 * customer can always switch there, and only the methods actually enabled on
 * the Razorpay account can complete a payment. So this is a shortcut, never a
 * promise we can't keep.
 */
const ONLINE_METHODS: {
  value: RazorpayPreferredMethod;
  label: string;
  hint: string;
  icon: string;
}[] = [
  { value: "upi", label: "UPI", hint: "GPay · PhonePe · Paytm", icon: "📲" },
  { value: "card", label: "Cards", hint: "Visa · Mastercard · RuPay", icon: "💳" },
  { value: "netbanking", label: "NetBanking", hint: "All major banks", icon: "🏦" },
  { value: "wallet", label: "Wallets", hint: "Paytm · Amazon Pay", icon: "👛" },
];

interface PaymentMethodsProps {
  value: PaymentMethod;
  onChange: (next: PaymentMethod) => void;
  /** Pre-selected tab inside the Razorpay modal. */
  preferred: RazorpayPreferredMethod | null;
  onPreferredChange: (next: RazorpayPreferredMethod | null) => void;
  /** Offer percent (0 hides every trace of the offer). */
  prepaidPercent: number;
  /** Rupees saved by paying online. */
  prepaidSaving: number;
  /** False when a COD rule (switch / value cap / cooldown) blocks this order. */
  codAllowed?: boolean;
  /** Why COD is unavailable — shown on the disabled card. */
  codBlockedReason?: string | null;
  /** False when the owner has switched online payment off in the panel. */
  onlineAllowed?: boolean;
  /** Why online payment is unavailable — shown on the disabled card. */
  onlineBlockedReason?: string | null;
  className?: string;
}

/**
 * Payment step: one prominent "Pay Online" card that expands into the method
 * shortcuts, and Cash on Delivery. The prepaid saving is shown in rupees on
 * both cards so the choice is a number, not a slogan — and that number is the
 * same one the server computes (lib/pricing.ts).
 */
export function PaymentMethods({
  value,
  onChange,
  preferred,
  onPreferredChange,
  prepaidPercent,
  prepaidSaving,
  codAllowed = true,
  codBlockedReason,
  onlineAllowed = true,
  onlineBlockedReason,
  className,
}: PaymentMethodsProps) {
  // Two separate reasons online payment can be off the table: the gateway was
  // never configured ("coming soon"), or the owner switched it off in the panel
  // ("not available", with the reason spelled out — same treatment as COD).
  const configured = isRazorpayEnabled();
  const online = configured && onlineAllowed;
  const onlineSelected = value === "razorpay";
  const showOffer = online && prepaidPercent > 0 && prepaidSaving > 0;
  const codSelected = value === "cod";

  return (
    <div className={cn("flex flex-col gap-3", className)} role="radiogroup" aria-label="Payment method">
      {/* ---------------- Pay online (prepaid) ---------------- */}
      <div
        className={cn(
          "overflow-hidden rounded-brand border transition-all",
          onlineSelected
            ? "border-brand bg-white shadow-brand ring-1 ring-brand/25"
            : "border-line bg-white hover:border-brand-light",
          !online && "opacity-70"
        )}
      >
        <button
          type="button"
          role="radio"
          aria-checked={onlineSelected}
          aria-disabled={!online}
          disabled={!online}
          onClick={() => online && onChange("razorpay")}
          className="flex w-full items-start gap-3 p-4 text-left disabled:cursor-not-allowed sm:gap-4 sm:p-5"
        >
          <Radio checked={onlineSelected} disabled={!online} />

          <span
            className={cn(
              "grid h-11 w-11 flex-none place-items-center rounded-xl text-xl ring-1 transition-colors",
              onlineSelected ? "bg-mint text-brand ring-brand/25" : "bg-soft text-muted ring-line"
            )}
            aria-hidden
          >
            💳
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className={cn("font-bold", online ? "text-ink" : "text-muted")}>
                Pay Online (Prepaid)
              </span>
              {showOffer && <span className="chip chip-gold">{prepaidPercent}% OFF</span>}
              {!configured && <span className="chip chip-soft">Coming soon</span>}
              {configured && !onlineAllowed && <span className="chip chip-soft">Not available</span>}
            </span>
            <span className="mt-1 block text-sm text-muted">
              {showOffer
                ? `Pay now and get ${prepaidPercent}% instant discount on this order.`
                : "UPI, Cards, NetBanking & Wallets — securely via Razorpay."}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <Icon name="lock" size={13} /> Secure payment
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon name="check" size={13} /> UPI, Cards, NetBanking &amp; Wallets
              </span>
            </span>

            {configured && !onlineAllowed && onlineBlockedReason && (
              <span className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-snug text-amber-800 ring-1 ring-amber-200">
                <Icon name="info" size={14} className="mt-px flex-none" />
                {onlineBlockedReason}
              </span>
            )}
          </span>

          {showOffer && (
            <span className="hidden flex-none text-right sm:block">
              <span className="block text-lg font-extrabold leading-none text-brand">
                −{formatPrice(prepaidSaving)}
              </span>
              <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                you save
              </span>
            </span>
          )}
        </button>

        {/* Method shortcuts — only while this option is the chosen one */}
        {onlineSelected && online && (
          <div className="animate-fadeIn border-t border-line bg-soft/60 p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Preferred method <span className="font-normal normal-case">(you can change it on the payment screen)</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {ONLINE_METHODS.map((m) => {
                const active = preferred === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onPreferredChange(active ? null : m.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all",
                      active
                        ? "border-brand bg-white shadow-brand ring-1 ring-brand/20"
                        : "border-line bg-white hover:border-brand-light hover:bg-mint/30"
                    )}
                  >
                    <span className="text-2xl leading-none" aria-hidden>
                      {m.icon}
                    </span>
                    <span className={cn("text-sm font-bold", active ? "text-brand-dark" : "text-ink")}>
                      {m.label}
                    </span>
                    <span className="text-[11px] leading-tight text-muted">{m.hint}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-mint/70 px-3 py-2 text-xs text-brand-dark">
              <Icon name="shield-check" size={15} className="flex-none text-brand" />
              Safe &amp; secure — your payment is protected with industry-standard encryption. We never
              see or store your card details.
            </p>
          </div>
        )}
      </div>

      {/* ---------------- Cash on delivery ---------------- */}
      {/* Blocked by a COD rule (value cap / once-an-hour): the card stays visible
          but un-pickable, with the reason spelled out — a silently missing option
          reads as a bug, and the server would refuse the order anyway. */}
      <button
        type="button"
        role="radio"
        aria-checked={codSelected}
        aria-disabled={!codAllowed}
        disabled={!codAllowed}
        onClick={() => codAllowed && onChange("cod")}
        className={cn(
          "flex items-start gap-3 rounded-brand border p-4 text-left transition-all disabled:cursor-not-allowed sm:gap-4 sm:p-5",
          codSelected && codAllowed
            ? "border-brand bg-white shadow-brand ring-1 ring-brand/25"
            : "border-line bg-white",
          codAllowed ? "hover:border-brand-light" : "bg-soft/50"
        )}
      >
        <Radio checked={codSelected && codAllowed} disabled={!codAllowed} />
        <span
          className={cn(
            "grid h-11 w-11 flex-none place-items-center rounded-xl text-xl ring-1 transition-colors",
            codSelected && codAllowed ? "bg-mint text-brand ring-brand/25" : "bg-soft text-muted ring-line",
            !codAllowed && "opacity-60"
          )}
          aria-hidden
        >
          💵
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={cn("font-bold", codAllowed ? "text-ink" : "text-muted")}>
              Cash on Delivery (COD)
            </span>
            {!codAllowed && <span className="chip chip-soft">Not available</span>}
          </span>
          <span className="mt-1 block text-sm text-muted">
            Pay in cash when your order arrives at your doorstep.
          </span>

          {!codAllowed && codBlockedReason && (
            <span className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-snug text-amber-800 ring-1 ring-amber-200">
              <Icon name="info" size={14} className="mt-px flex-none" />
              {codBlockedReason}
            </span>
          )}

          {codAllowed && showOffer && (
            <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-gold">
              <span aria-hidden>💡</span> Switch to online payment and save {formatPrice(prepaidSaving)}
            </span>
          )}
        </span>
      </button>

      <p className="flex items-center gap-2 px-1 text-xs text-muted">
        <Icon name="shield-check" size={15} className="text-brand" />
        <span>
          <span className="font-semibold text-ink">100% secure payments.</span> Your details are always
          protected.
        </span>
      </p>
    </div>
  );
}

/** Shared radio dot so both cards stay pixel-identical. */
function Radio({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-colors",
        checked ? "border-brand" : "border-line",
        disabled && "border-line"
      )}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
    </span>
  );
}
