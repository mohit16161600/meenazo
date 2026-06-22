"use client";

import { cn } from "@/utils/cn";

/** Compact +/- quantity stepper. */
export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center border border-line rounded-full overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-lg hover:bg-soft disabled:opacity-40 transition-colors"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="w-10 text-center font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-lg hover:bg-soft disabled:opacity-40 transition-colors"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
