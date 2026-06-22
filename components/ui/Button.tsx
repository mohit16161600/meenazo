import Link from "next/link";
import { cn } from "@/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

const variantClass: Record<Variant, string> = {
  primary: "btn",
  ghost: "btn btn-ghost",
  dark: "btn btn-dark",
};
const sizeClass: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

/** Button or link styled with the brand pill look. Pass `href` to render a Link. */
export function Button({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  href,
  ...rest
}: BaseProps & { href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(variantClass[variant], sizeClass[size], block && "btn-block", className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
