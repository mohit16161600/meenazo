"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { banners } from "@/data/banners";
import { features } from "@/data/benefits";
import { siteConfig } from "@/data/site";
import { cn } from "@/utils/cn";

const AUTOPLAY_MS = 6000;

/**
 * Hero — editorial split layout.
 * ---------------------------------------------------------------------------
 * Left: eyebrow rule, a headline whose LAST line is set in the handwritten
 * accent, one line of copy, the primary CTA paired with a circular secondary
 * action, then the trust strip. Right: the banner art inside a soft ring.
 *
 * Everything is still driven by `data/banners` (panel-editable), so the owner
 * can change copy, art and links without touching this file. The last line of
 * `title` is the one that gets the accent — write titles with that in mind.
 */
export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  const goTo = useCallback((index: number) => {
    setActive((index + banners.length) % banners.length);
  }, []);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % total), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  const slide = banners[active];
  const lines = slide.title.split("\n");
  const headline = lines.slice(0, -1);
  const accent = lines[lines.length - 1];

  const expertHref = `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(
    "Hi Meenazo, I'd like advice on which product suits me."
  )}`;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-mint/70 via-soft to-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      {/* Soft organic blobs — depth without another image request */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/10 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-gold/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1240px] items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:py-20">
        {/* ---------------- Copy ---------------- */}
        <div key={slide.id} className="animate-fadeIn order-2 lg:order-1">
          <span className="eyebrow eyebrow-rule">{slide.subtitle}</span>

          <h1 className="mt-4 text-balance text-[36px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[46px] lg:text-[58px]">
            {headline.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
            <span className="script mt-1 block">{accent}</span>
          </h1>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted sm:text-base">
            {slide.description}
          </p>

          {/* Primary CTA + circular secondary action */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={slide.buttonLink}
              className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition-all hover:bg-brand-dark hover:shadow-brand-lg"
            >
              {slide.buttonText}
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
                <Icon name="arrow-right" size={14} />
              </span>
            </Link>

            {slide.secondaryButtonText && slide.secondaryButtonLink ? (
              <Link href={slide.secondaryButtonLink} className="group inline-flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-brand ring-1 ring-line transition-transform group-hover:scale-105">
                  <Icon name="arrow-right" size={18} />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-bold text-ink">{slide.secondaryButtonText}</span>
                  <span className="block text-xs text-muted">Know the science</span>
                </span>
              </Link>
            ) : (
              <a href={expertHref} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand shadow-brand ring-1 ring-line transition-transform group-hover:scale-105">
                  <Icon name="whatsapp" size={20} />
                </span>
                <span className="text-left">
                  <span className="block text-sm font-bold text-ink">Talk to an expert</span>
                  <span className="block text-xs text-muted">Free Ayurvedic advice</span>
                </span>
              </a>
            )}
          </div>

          {/* Trust strip */}
          <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            {features.map((f) => (
              <li key={f.title} className="flex items-center gap-2.5">
                <span
                  className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-brand ring-1 ring-line"
                  aria-hidden
                >
                  <Icon name={f.icon} size={16} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-bold text-ink">{f.title}</span>
                  <span className="block text-[11px] text-muted">{f.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------------- Art ---------------- */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-[420px] lg:max-w-[500px]">
            {/* Concentric rings behind the portrait */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-mint/60 to-brand/15"
            />
            <span aria-hidden className="absolute inset-3 rounded-full ring-1 ring-white/70" />

            <div className="absolute inset-5 overflow-hidden rounded-full shadow-brand-lg">
              {slide.image ? (
                <Image
                  key={slide.id}
                  src={slide.image}
                  alt={slide.title.replace(/\n/g, " ")}
                  fill
                  sizes="(max-width: 1024px) 90vw, 500px"
                  className="animate-fadeIn object-cover"
                  priority={active === 0}
                />
              ) : (
                <div
                  className="flex h-full items-center justify-center"
                  style={{ background: slide.artBackground }}
                  aria-hidden
                >
                  <span className="select-none text-[110px] leading-none">{slide.emoji}</span>
                </div>
              )}
            </div>

            {/* Floating proof card */}
            <div className="absolute -bottom-2 left-0 flex items-center gap-2.5 rounded-2xl bg-white/95 px-4 py-3 shadow-brand-lg ring-1 ring-line backdrop-blur sm:left-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-brand" aria-hidden>
                <Icon name="leaf" size={18} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-extrabold text-ink">100% Herbal</span>
                <span className="block text-[11px] text-muted">Made in India</span>
              </span>
            </div>

            <div className="absolute -top-1 right-0 flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 shadow-brand-lg ring-1 ring-line backdrop-blur">
              <span className="stars" aria-hidden>
                ★★★★★
              </span>
              <span className="text-xs font-bold text-ink">4.8/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide dots */}
      {total > 1 && (
        <div className="relative flex items-center justify-center gap-2 pb-8">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === active ? "w-8 bg-brand" : "w-2 bg-brand/25 hover:bg-brand/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
