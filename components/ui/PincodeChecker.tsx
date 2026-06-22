"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/ui/Icon";

type CheckState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ok"; eta: string; cod: boolean };

/**
 * Lightweight "Check delivery" widget.
 * Placeholder logic only — derives a plausible ETA from the pincode so the
 * estimate feels real without any backend. Swap for a real serviceability
 * API later (the input/UX contract stays the same).
 */
export function PincodeChecker({ className }: { className?: string }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<CheckState>({ status: "idle" });

  const check = () => {
    const value = pincode.trim();
    if (!/^\d{6}$/.test(value)) {
      setResult({ status: "error", message: "Enter a valid 6-digit pincode." });
      return;
    }
    // Deterministic but plausible: metro-ish pincodes ship faster.
    const lead = Number(value[0]);
    const fast = lead <= 5;
    const eta = fast ? "3-5 business days" : "5-7 business days";
    const cod = Number(value[5]) % 2 === 0;
    setResult({ status: "ok", eta, cod });
  };

  return (
    <div className={cn("rounded-brand border border-line bg-soft p-4", className)}>
      <div className="flex items-center gap-2 mb-2.5">
        <Icon name="truck" size={18} className="text-brand" />
        <span className="text-sm font-semibold text-ink">Check delivery to your area</span>
      </div>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="pincode-input">
          Delivery pincode
        </label>
        <input
          id="pincode-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
            if (result.status !== "idle") setResult({ status: "idle" });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") check();
          }}
          placeholder="Enter pincode"
          className="field !mb-0 flex-1"
          aria-invalid={result.status === "error"}
        />
        <button type="button" onClick={check} className="btn btn-ghost btn-sm shrink-0">
          Check
        </button>
      </div>

      {result.status === "error" && (
        <p className="mt-2 text-xs text-red-600">{result.message}</p>
      )}

      {result.status === "ok" && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 text-brand font-semibold">
            <Icon name="check-circle" size={16} className="text-brand" /> Delivers to {pincode}
          </span>
          <span className="text-muted">·</span>
          <span className="text-ink">Delivery in {result.eta}</span>
          <span className="text-muted">·</span>
          <span className="text-ink">{result.cod ? "COD available" : "Prepaid only"}</span>
        </div>
      )}
    </div>
  );
}
