import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { siteConfig } from "@/data/site";

/**
 * Shared visual shell for all authentication screens.
 * Desktop: a two-panel card — a calm brand panel on the left, the form on the right.
 * Mobile: just the form, with a compact logo header.
 * Server component: it only composes layout around {children}.
 */

const trustBullets: { icon: string; title: string; copy: string }[] = [
  {
    icon: "leaf",
    title: "100% authentic Ayurveda",
    copy: "Lab-tested formulations crafted from time-honoured herbs.",
  },
  {
    icon: "lock",
    title: "Your data stays private",
    copy: "Secure checkout and orders tied to your account alone.",
  },
  {
    icon: "truck",
    title: "Faster, tracked checkout",
    copy: "Save addresses and reorder your wellness essentials in a tap.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="bg-soft min-h-[78vh] flex items-center justify-center px-4 py-10 md:py-16">
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 bg-white rounded-brand shadow-brand-lg overflow-hidden border border-line animate-fadeIn">
          {/* Brand panel — desktop only */}
          <aside
            className="relative hidden lg:flex flex-col justify-between p-10 xl:p-12 text-white bg-brand bg-gradient-to-br from-brand to-brand-dark"
            aria-hidden="false"
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-brand-light/25 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-0 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative">
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 text-white"
                aria-label={`${siteConfig.name} home`}
              >
                <span className="grid place-items-center h-11 w-11 rounded-full bg-white/15 text-2xl backdrop-blur">
                  {siteConfig.logoEmoji}
                </span>
                <span className="text-xl font-bold tracking-tight">{siteConfig.name}</span>
              </Link>

              <h2 className="text-white mt-9 leading-tight text-balance">{siteConfig.tagline}</h2>
              <p className="mt-3 text-white/85 leading-relaxed max-w-sm">
                Join thousands who trust {siteConfig.name} for pure, potent Ayurvedic wellness — rooted in
                tradition, made for modern life.
              </p>
            </div>

            <ul className="relative mt-10 space-y-5">
              {trustBullets.map((b) => (
                <li key={b.title} className="flex items-start gap-3.5">
                  <span className="grid place-items-center h-10 w-10 shrink-0 rounded-full bg-white/15 text-white backdrop-blur">
                    <Icon name={b.icon} size={20} />
                  </span>
                  <span>
                    <span className="block font-semibold leading-snug">{b.title}</span>
                    <span className="block text-sm text-white/80 leading-snug">{b.copy}</span>
                  </span>
                </li>
              ))}
            </ul>
          </aside>

          {/* Form area */}
          <div className="p-6 sm:p-10 xl:p-12 flex flex-col justify-center">
            {/* Compact logo for mobile (brand panel is hidden) */}
            <Link
              href="/"
              className="lg:hidden inline-flex items-center gap-2.5 text-ink mb-8 self-start"
              aria-label={`${siteConfig.name} home`}
            >
              <span className="grid place-items-center h-10 w-10 rounded-full bg-mint text-xl">
                {siteConfig.logoEmoji}
              </span>
              <span className="text-lg font-bold tracking-tight">{siteConfig.name}</span>
            </Link>

            <div className="w-full max-w-md mx-auto lg:mx-0">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
