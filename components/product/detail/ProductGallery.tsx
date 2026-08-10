"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ImageRef, Product } from "@/types";
import { imgAlt, imgSrc, imgTitle } from "@/utils/image";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Badge, toneForBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/utils/cn";

interface View {
  /** May be a bare path or an asset carrying its own alt text. */
  src?: ImageRef;
  emoji: string;
  label: string;
}

const DEFAULT_GRADIENT: [string, string] = ["#eef5f0", "#dceee4"];
const SUPPORTING_EMOJI = ["✨", "🧪", "🌱"];

/**
 * Premium product gallery: one big stage with the selected photo, and a
 * horizontal thumbnail rail underneath it — tap a thumbnail and it becomes the
 * main image. Real product photos go through next/image (with a hover zoom);
 * a product with no photos yet falls back to gradient + emoji art.
 *
 * The rail only appears once a product actually has more than one photo, which
 * the owner adds in the panel (Products → Media → "Product photos").
 */
export function ProductGallery({ product }: { product: Product }) {
  const gradient = product.gradient ?? DEFAULT_GRADIENT;

  const views = useMemo<View[]>(() => {
    const realImages = product.images ?? [];
    if (realImages.length > 0) {
      return realImages.map((src, i) => ({ src, emoji: product.emoji, label: `View ${i + 1}` }));
    }
    return [
      { emoji: product.emoji, label: "Product" },
      ...SUPPORTING_EMOJI.map((e, i) => ({
        emoji: e,
        label: ["Detail", "Lab tested", "Natural"][i] ?? "Detail",
      })),
    ];
  }, [product.images, product.emoji]);

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const current = views[active] ?? views[0];
  const hasImage = Boolean(current?.src);

  // Zoom is a desktop affordance, and it earns its keep only on the wide
  // layout: the zoomed photo is clipped by the stage, so on a narrow screen —
  // where the photo is already the widest thing on the page — it just lops the
  // edges off. Two guards, because they catch different things: the media query
  // rules out narrow windows, `pointerType` rules out a tap on a touchscreen
  // (which still fires mouseenter/mousemove and used to leave the photo stuck
  // at 1.18× with its sides cut off).
  const [zoomable, setZoomable] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const sync = () => setZoomable(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const isMouse = (e: React.PointerEvent) => zoomable && e.pointerType === "mouse";

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el || !isMouse(e)) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: px * -28, y: py * -28 });
  };

  const resetZoom = () => {
    setHovering(false);
    setOffset({ x: 0, y: 0 });
  };

  /** Move the selection one photo left/right (the ‹ › buttons and arrow keys). */
  const step = (delta: number) =>
    setActive((i) => Math.min(views.length - 1, Math.max(0, i + delta)));

  // Swipe across the stage to change photo — on a phone that's the gesture
  // people reach for first, and the thumbnail rail alone is a small target.
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    swipeRef.current = t ? { x: t.clientX, y: t.clientY } : null;
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeRef.current;
    const t = e.changedTouches[0];
    swipeRef.current = null;
    if (!start || !t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // A mostly-vertical drag is the page scrolling, not a swipe — leave it be.
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    step(dx < 0 ? 1 : -1);
  };

  // Keep the selected thumbnail inside the visible part of the rail. Scrolling
  // the rail element itself (rather than scrollIntoView) means stepping through
  // photos never yanks the whole page around.
  useEffect(() => {
    const rail = railRef.current;
    const thumb = rail?.children[active] as HTMLElement | undefined;
    if (!rail || !thumb) return;
    rail.scrollTo({
      left: Math.max(0, thumb.offsetLeft - (rail.clientWidth - thumb.clientWidth) / 2),
      behavior: "smooth",
    });
  }, [active]);

  // `min-w-0` is load-bearing: as a grid item this box defaults to
  // `min-width: auto`, so the thumbnail rail's min-content width (every thumb
  // laid end to end — wider than a phone) became the column's minimum and blew
  // the whole page past the viewport. Zero lets it shrink and the rail scroll.
  //
  // The max-widths keep a square stage from running away: full-column it would
  // stand as tall as the phone is wide (pushing the price below the fold) and
  // ~700px tall on a tablet. Nudge the 300px if the phone crop feels off.
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[300px] flex-col gap-4 self-start sm:max-w-[520px] lg:max-w-none">
      {/* Hero stage */}
      <div
        ref={stageRef}
        onPointerEnter={(e) => {
          if (isMouse(e)) setHovering(true);
        }}
        onPointerLeave={resetZoom}
        onPointerCancel={resetZoom}
        onPointerMove={onPointerMove}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        // Square at every width, because the photos themselves are square: any
        // other ratio letterboxes them, and the bands read as white stripes
        // against the beige the product is shot on. The phone keeps its height
        // down by capping the stage's width instead (see the wrapper above).
        className={cn(
          "relative w-full aspect-square rounded-brand overflow-hidden border border-line shadow-brand select-none touch-pan-y",
          zoomable && "cursor-zoom-in"
        )}
        style={{
          // Real studio photos are shot on white — give them a clean white
          // stage so they blend seamlessly. The mint gradient is only used for
          // the emoji-art fallback (no real image).
          background: hasImage ? "#ffffff" : `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})`,
        }}
      >
        {/* Badges overlay */}
        {product.badges && product.badges.length > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1.5">
            {product.badges.map((b) => (
              <Badge key={b} variant={toneForBadge(b)}>
                {b}
              </Badge>
            ))}
          </div>
        )}

        {/* Zoomable media */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${hovering ? 1.18 : 1})`,
          }}
        >
          {imgSrc(current.src) ? (
            <Image
              src={imgSrc(current.src)!}
              // The photo's own alt wins; the product name is the fallback so
              // a gallery image is never announced as nothing.
              alt={imgAlt(current.src, product.name)}
              title={imgTitle(current.src)}
              fill
              sizes="(max-width: 640px) 300px, (max-width: 1024px) 520px, 600px"
              // No inset. The photos are shot edge to edge on beige, so padding
              // here doesn't read as breathing room — it reads as a white band
              // framing the picture.
              className="object-contain"
              priority
            />
          ) : (
            <span
              aria-hidden
              className="leading-none drop-shadow-sm"
              // Scales with the stage so it never bursts out of a phone-sized box.
              style={{ fontSize: "clamp(96px, 42vw, 200px)" }}
            >
              {current.emoji}
            </span>
          )}
        </div>

        {/* Subtle gloss (emoji-art only — a dark wash muddies a white photo) + hint */}
        {!hasImage && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent" />
        )}
        {/* The hint follows the same flag as the behaviour, so it can never
            promise a zoom that isn't there. Without one, the swipe position is
            the more useful thing to show. */}
        {zoomable ? (
          <span className="pointer-events-none absolute bottom-3 right-4 text-[11px] font-medium text-ink/50">
            Hover to zoom
          </span>
        ) : (
          views.length > 1 && (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium tabular-nums text-ink/60 shadow-sm backdrop-blur">
              {active + 1} / {views.length}
            </span>
          )
        )}
      </div>

      {/* Thumbnail rail — only earns its space once there's more than one photo */}
      {views.length > 1 && (
        <div className="relative">
          <RailArrow
            side="left"
            disabled={active === 0}
            onClick={() => step(-1)}
            label="Previous photo"
          />

          <div
            ref={railRef}
            role="tablist"
            aria-label="Product images"
            // Arrow keys walk the rail the way a native tablist does.
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                step(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                step(-1);
              }
            }}
            className="no-scrollbar flex gap-2.5 overflow-x-auto scroll-smooth px-11 sm:gap-3 sm:px-12"
          >
            {views.map((v, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show ${v.label}`}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition-all sm:h-20 sm:w-20",
                  i === active
                    ? "border-brand shadow-brand"
                    : "border-line opacity-80 hover:border-brand-light hover:opacity-100"
                )}
              >
                <ArtPlaceholder
                  src={v.src}
                  emoji={v.emoji}
                  gradient={gradient}
                  alt={product.name}
                  className="h-full w-full"
                  fontSize={30}
                  sizes="80px"
                />
              </button>
            ))}
          </div>

          <RailArrow
            side="right"
            disabled={active === views.length - 1}
            onClick={() => step(1)}
            label="Next photo"
          />
        </div>
      )}
    </div>
  );
}

/**
 * The ‹ › buttons sitting at either end of the thumbnail rail. They step the
 * selection rather than just scrolling, so a tap always changes the big photo —
 * on a phone that's the difference between a working control and a dead one.
 */
function RailArrow({
  side,
  disabled,
  onClick,
  label,
}: {
  side: "left" | "right";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        // 40px square — a thumb-sized target, not a desktop-sized one.
        "absolute top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-white/95 text-ink shadow-sm backdrop-blur transition-colors",
        side === "left" ? "left-0" : "right-0",
        disabled ? "cursor-not-allowed opacity-35" : "hover:border-brand hover:text-brand"
      )}
    >
      <Icon name={side === "left" ? "chevron-left" : "chevron-right"} size={16} />
    </button>
  );
}
