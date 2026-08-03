"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { Icon } from "./Icon";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
      aria-hidden
    />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "outline";
  loading?: boolean;
  icon?: string;
};

/**
 * One radius for every control and surface (12px). Only genuinely round things
 * - pills, avatars, dots, switches - use `rounded-full`; mixing 8/12/16px on
 * comparable surfaces is what makes an admin UI look assembled rather than
 * designed.
 */
export const R = "rounded-xl";

/**
 * Every button carries all five states: default, hover, FOCUS, active(press),
 * loading and disabled. The focus ring is not optional - these controls sit on
 * white, so a keyboard user has no other way to see where they are.
 */
const btnBase =
  `inline-flex min-h-[44px] items-center justify-center gap-2 ${R} px-4 py-2.5 text-sm font-semibold transition-all ` +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 " +
  "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";
const btnStyles: Record<string, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark shadow-sm shadow-brand/20",
  outline: "border border-line bg-white text-ink hover:border-brand/40 hover:bg-soft",
  ghost: "text-muted hover:bg-soft hover:text-ink",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function Button({
  variant = "primary",
  loading,
  icon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(btnBase, btnStyles[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner /> : icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  icon,
  className,
  children,
  target,
}: {
  href: string;
  variant?: "primary" | "outline" | "ghost";
  icon?: string;
  className?: string;
  children: React.ReactNode;
  target?: string;
}) {
  return (
    <Link href={href} target={target} className={clsx(btnBase, btnStyles[variant], className)}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </Link>
  );
}

export function Switch({
  checked,
  onChange,
  disabled,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-brand" : "bg-slate-300",
        disabled && "opacity-50"
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

/**
 * Two-state segmented control where the CURRENT state's button is disabled.
 *
 * Clicking "Active" on something already active does nothing, so the button
 * shouldn't invite the click - the disabled side doubles as the status readout
 * (Norman: constrain the impossible action instead of letting it fail).
 * Both labels are always visible, so the state never depends on colour alone.
 */
export function SegmentedToggle({
  value,
  onChange,
  onLabel = "Active",
  offLabel = "Inactive",
  disabled,
  size = "md",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs";
  const base = `${pad} font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40`;
  return (
    <span className="inline-flex overflow-hidden rounded-xl border border-line" role="group">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled || value}
        aria-pressed={value}
        title={value ? `Already ${onLabel.toLowerCase()}` : `Set ${onLabel.toLowerCase()}`}
        className={clsx(
          base,
          value
            ? "cursor-default bg-brand text-white"
            : "bg-white text-muted hover:bg-mint hover:text-brand-dark"
        )}
      >
        {onLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled || !value}
        aria-pressed={!value}
        title={!value ? `Already ${offLabel.toLowerCase()}` : `Set ${offLabel.toLowerCase()}`}
        className={clsx(
          base,
          "border-l border-line",
          !value
            ? "cursor-default bg-slate-500 text-white"
            : "bg-white text-muted hover:bg-soft hover:text-ink"
        )}
      >
        {offLabel}
      </button>
    </span>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(31,42,36,.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue" | "violet";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-slate-100 text-slate-600 ring-slate-200",
    green: "bg-mint text-brand-dark ring-brand/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    violet: "bg-violet-50 text-violet-700 ring-violet-200",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function IconButton({
  icon,
  onClick,
  title,
  tone = "default",
  disabled,
  href,
}: {
  icon: string;
  onClick?: () => void;
  title: string;
  tone?: "default" | "danger";
  disabled?: boolean;
  href?: string;
}) {
  // 44x44 hit area even though the glyph is 16px - the icon is centred inside a
  // full-size target rather than the target shrinking to the icon.
  const cls = clsx(
    `inline-flex h-11 w-11 items-center justify-center ${R} border border-transparent transition-colors`,
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-40",
    tone === "danger"
      ? "text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      : "text-slate-400 hover:border-brand/30 hover:bg-mint hover:text-brand-dark"
  );
  if (href)
    return (
      <Link href={href} title={title} aria-label={title} className={cls}>
        <Icon name={icon} size={16} />
      </Link>
    );
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cls}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}

export function EmptyState({
  icon = "box",
  title,
  hint,
  action,
}: {
  icon?: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-mint text-brand">
        <Icon name={icon} size={26} />
      </div>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-20 text-muted"
      role="status"
      aria-live="polite"
    >
      <Spinner className="text-brand" /> {label}
    </div>
  );
}

/** One shimmering block. Compose these into a shape that matches real content. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse rounded-xl bg-soft", className)} aria-hidden />;
}

/**
 * Loading placeholder shaped like the table it replaces - a skeleton only helps
 * if it predicts the layout; a bare spinner tells the reader nothing about what
 * is coming.
 */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="p-4" role="status" aria-live="polite" aria-label="Loading content">
      <div className="mb-4 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={clsx("h-9 flex-1", c === 0 && "max-w-[120px]")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Error state: what failed, and what to do about it. Never a bare code - the
 * reader can't act on "Request failed (500)".
 */
export function ErrorState({
  title = "Something didn't load",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center" role="alert">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <Icon name="alert" size={26} />
      </div>
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
      {onRetry && (
        <Button variant="outline" icon="refresh" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
