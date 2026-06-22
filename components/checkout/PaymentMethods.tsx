"use client";

import { cn } from "@/utils/cn";
import type { PaymentMethod } from "@/types";
import { Icon } from "@/components/ui/Icon";

interface PaymentOption {
  value: PaymentMethod;
  icon: string;
  title: string;
  description: string;
  /** Available now vs. a coming-soon placeholder. */
  available: boolean;
  note?: string;
}

const OPTIONS: PaymentOption[] = [
  {
    value: "cod",
    icon: "cash",
    title: "Cash on Delivery",
    description: "Pay in cash when your order arrives at your doorstep.",
    available: true,
  },
  {
    value: "upi",
    icon: "wallet",
    title: "UPI",
    description: "Pay via any UPI app — GPay, PhonePe, Paytm & more.",
    available: false,
    note: "Coming soon",
  },
  {
    value: "razorpay",
    icon: "credit-card",
    title: "Razorpay",
    description: "Cards, NetBanking & Wallets — secured by Razorpay.",
    available: false,
    note: "Coming soon",
  },
];

interface PaymentMethodsProps {
  value: PaymentMethod;
  onChange: (next: PaymentMethod) => void;
  className?: string;
}

/**
 * Radio-style selectable payment cards. Only Cash on Delivery is active in the
 * demo; UPI and Razorpay are shown as polished "coming soon" placeholders.
 */
export function PaymentMethods({ value, onChange, className }: PaymentMethodsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", className)} role="radiogroup" aria-label="Payment method">
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        const disabled = !opt.available;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={disabled}
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            className={cn(
              "group flex items-start gap-4 rounded-brand border p-4 text-left transition-all",
              selected
                ? "border-brand bg-mint shadow-brand ring-1 ring-brand/30"
                : "border-line bg-white hover:border-brand-light",
              disabled && "cursor-not-allowed opacity-70 hover:border-line"
            )}
          >
            {/* Radio indicator */}
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-colors",
                selected ? "border-brand" : "border-line group-hover:border-brand-light",
                disabled && "border-line"
              )}
            >
              {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
            </span>

            {/* Icon */}
            <Icon name={opt.icon} size={24} className="mt-0.5 flex-none text-brand" />

            {/* Copy */}
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-ink">{opt.title}</span>
                {opt.available ? (
                  <span className="chip chip-soft">Available</span>
                ) : (
                  opt.note && <span className="chip chip-gold">{opt.note}</span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted">{opt.description}</span>
            </span>
          </button>
        );
      })}

      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <Icon name="lock" size={14} />
        100% secure payments. Your details are always protected.
      </p>
    </div>
  );
}
