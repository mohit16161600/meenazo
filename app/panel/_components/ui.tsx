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

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
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
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
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
  const cls = clsx(
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent transition-colors disabled:opacity-40",
    tone === "danger"
      ? "text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
      : "text-slate-400 hover:border-brand/30 hover:bg-mint hover:text-brand-dark"
  );
  if (href)
    return (
      <Link href={href} title={title} className={cls}>
        <Icon name={icon} size={16} />
      </Link>
    );
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cls}>
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint text-brand">
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
    <div className="flex items-center justify-center gap-2 py-20 text-muted">
      <Spinner className="text-brand" /> {label}
    </div>
  );
}
