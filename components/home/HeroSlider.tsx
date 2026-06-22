"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { banners } from "@/data/banners";
import { cn } from "@/utils/cn";

const AUTOPLAY_MS = 5000;

/** Auto-rotating full-width hero slider built from the `banners` data. */
export function HeroSlider() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  const goTo = useCallback((index: number) => {
    setActive((index + banners.length) % banners.length);
  }, []);
  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % total);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, total]);

  const slide = banners[active];

  return (
    <Container className="pt-6 sm:pt-8">
      <div
        className="relative overflow-hidden rounded-brand shadow-brand"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured offers"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          key={slide.id}
          className="grid animate-fadeIn items-center gap-0 md:grid-cols-[1.1fr_1fr]"
          style={{ background: slide.backgroundColor }}
          aria-roledescription="slide"
          aria-label={`Slide ${active + 1} of ${total}`}
        >
          {/* Text side */}
          <div className="order-2 px-6 py-10 sm:px-10 md:order-1 md:py-16 lg:px-14">
            <span className="eyebrow">{slide.subtitle}</span>
            <h1 className="mt-3 text-balance text-[34px] font-bold leading-[1.08] tracking-tight text-ink sm:text-[40px] lg:text-[48px]">
              {slide.title.split("\n").map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              {slide.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href={slide.buttonLink} size="lg">
                {slide.buttonText}
              </Button>
              {slide.secondaryButtonText && slide.secondaryButtonLink && (
                <Button href={slide.secondaryButtonLink} variant="ghost" size="lg">
                  {slide.secondaryButtonText}
                </Button>
              )}
            </div>
          </div>

          {/* Art side */}
          <div
            className="relative order-1 h-48 sm:h-64 md:order-2 md:h-full md:min-h-[360px]"
            style={{ background: slide.artBackground }}
          >
            {slide.image ? (
              <Image
                src={slide.image}
                alt={slide.title.replace(/\n/g, " ")}
                fill
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                priority={active === 0}
              />
            ) : (
              <div className="flex h-full items-center justify-center" aria-hidden>
                <span className="select-none text-[88px] leading-none drop-shadow-sm sm:text-[110px] md:text-[140px]">
                  {slide.emoji}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Prev / next arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-ink shadow-brand backdrop-blur transition hover:bg-white sm:flex"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-ink shadow-brand backdrop-blur transition hover:bg-white sm:flex"
            >
              ›
            </button>
          </>
        )}

        {/* Dots */}
        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === active ? "w-7 bg-brand" : "w-2 bg-white/70 hover:bg-white"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
