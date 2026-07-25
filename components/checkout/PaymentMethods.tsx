"use client";

import { cn } from "@/utils/cn";
import type { PaymentMethod } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { isRazorpayEnabled } from "@/services/razorpayService";

interface PaymentOption {
  value: PaymentMethod;
  icon: string;
  title: string;
  description: string;
  available: boolean;
  badge?: string;
  note?: string;
}

interface PaymentMethodsProps {
  value: PaymentMethod;
  onChange: (next: PaymentMethod) => void;
  className?: string;
}

/**
 * Radio-style selectable payment cards. Razorpay (Cards/UPI/NetBanking/Wallets)
 * is live once the keys are configured (NEXT_PUBLIC_RAZORPAY_KEY_ID present);
 * otherwise it shows as "coming soon" and Cash on Delivery is used.
 */
export function PaymentMethods({ value, onChange, className }: PaymentMethodsProps) {
  const online = isRazorpayEnabled();

  const options: PaymentOption[] = [
    {
      value: "razorpay",
      icon: "credit-card",
      title: "Pay Online",
      description: "UPI, Cards, NetBanking & Wallets — securely via Razorpay.",
      available: online,
      badge: online ? "Recommended" : undefined,
      note: online ? undefined : "Coming soon",
    },
    {
      value: "cod",
      icon: "cash",
      title: "Cash on Delivery",
      description: "Pay in cash when your order arrives at your doorstep.",
      available: true,
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 gap-3", className)} role="radiogroup" aria-label="Payment method">
      {options.map((opt) => {
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
                {opt.badge && <span className="chip chip-soft">{opt.badge}</span>}
                {opt.note && <span className="chip chip-gold">{opt.note}</span>}
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
