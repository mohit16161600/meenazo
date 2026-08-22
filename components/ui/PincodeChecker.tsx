"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/ui/Icon";

type CheckState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unserviceable"; pincode: string }
  | { status: "ok"; pincode: string; minDays: number; maxDays: number; cod: boolean };

interface EddResponse {
  success?: boolean;
  message?: string;
  serviceable?: boolean;
  unavailable?: boolean;
  minDays?: number;
  maxDays?: number;
  cod?: boolean;
}

/**
 * "Check delivery" widget on the product page.
 * ---------------------------------------------------------------------------
 * Backed by the real ClickPost EDD data (/api/edd → lib/edd.ts), which returns
 * the fastest of the five dispatch warehouses for that pincode.
 *
 * It used to invent the answer: the ETA came from the pincode's FIRST digit
 * and "COD available" from its LAST digit, so the page confidently promised
 * delivery windows and payment options that nothing had checked.
 *
 * When the courier lookup itself is unreachable the widget says so rather than
 * claiming the address is unserviceable — an outage on our side must not read
 * as "we don't deliver to you".
 */
export function PincodeChecker({ className }: { className?: string }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<CheckState>({ status: "idle" });

  async function check() {
    const value = pincode.trim();
    if (!/^[1-9]\d{5}$/.test(value)) {
      setResult({ status: "error", message: "Enter a valid 6-digit pincode." });
      return;
    }

    setResult({ status: "loading" });
    try {
      const res = await fetch(`/api/edd?pincode=${encodeURIComponent(value)}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as EddResponse;

      if (!data.success) {
        setResult({ status: "error", message: data.message ?? "Could not check that pincode." });
        return;
      }
      if (data.unavailable) {
        setResult({
          status: "error",
          message: "Delivery check is unavailable right now. Please try again in a moment.",
        });
        return;
      }
      if (!data.serviceable) {
        setResult({ status: "unserviceable", pincode: value });
        return;
      }

      setResult({
        status: "ok",
        pincode: value,
        minDays: Number(data.minDays ?? 0),
        maxDays: Number(data.maxDays ?? 0),
        cod: Boolean(data.cod),
      });
    } catch {
      setResult({
        status: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  const busy = result.status === "loading";

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
            if (e.key === "Enter") void check();
          }}
          placeholder="Enter pincode"
          className="field !mb-0 flex-1"
          aria-invalid={result.status === "error"}
        />
        <button
          type="button"
          onClick={() => void check()}
          disabled={busy}
          className="btn btn-ghost btn-sm shrink-0 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </div>

      {/* aria-live: the answer replaces itself in place, so a screen reader
          needs to be told it changed. */}
      <div aria-live="polite">
        {result.status === "error" && <p className="mt-2 text-xs text-red-600">{result.message}</p>}

        {result.status === "unserviceable" && (
          <p className="mt-2.5 flex items-start gap-1.5 text-sm text-amber-700">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            <span>
              Sorry, we don&apos;t deliver to {result.pincode} yet. Try a nearby pincode, or contact
              us and we&apos;ll see what we can do.
            </span>
          </p>
        )}

        {result.status === "ok" && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 text-brand font-semibold">
              <Icon name="check-circle" size={16} className="text-brand" /> Delivers to{" "}
              {result.pincode}
            </span>
            <span className="text-muted">·</span>
            <span className="text-ink">
              {result.minDays === result.maxDays
                ? `Delivery in ${result.maxDays} business ${result.maxDays === 1 ? "day" : "days"}`
                : `Delivery in ${result.minDays}–${result.maxDays} business days`}
            </span>
            <span className="text-muted">·</span>
            <span className="text-ink">{result.cod ? "COD available" : "Prepaid only"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
