"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { Product } from "@/types";
import { ArtPlaceholder } from "@/components/ui/ArtPlaceholder";
import { Badge, toneForBadge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

interface View {
  src?: string;
  emoji: string;
  label: string;
}

const DEFAULT_GRADIENT: [string, string] = ["#eef5f0", "#dceee4"];
const SUPPORTING_EMOJI = ["✨", "🧪", "🌱"];

/**
 * Premium product gallery. Shows real product photos (next/image) when
 * available — with a hover zoom — and falls back to gradient + emoji art.
 */
export function ProductGallery({ product }: { product: Product }) {
  const gradient = product.gradient ?? DEFAULT_GRADIENT;
  const realImages = product.images ?? [];
  const hasReal = realImages.length > 0;

  const views = useMemo<View[]>(() => {
    if (hasReal) {
      return realImages.map((src, i) => ({ src, emoji: product.emoji, label: `View ${i + 1}` }));
    }
    return [
      { emoji: product.emoji, label: "Product" },
      ...SUPPORTING_EMOJI.map((e, i) => ({
        emoji: e,
        label: ["Detail", "Lab tested", "Natural"][i] ?? "Detail",
      })),
    ];
  }, [hasReal, realImages, product.emoji]);

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);

  const current = views[active] ?? views[0];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: px * -28, y: py * -28 });
  };

  return (
    <div className="flex flex-col-reverse gap-4 sm:flex-row">
      {/* Thumbnail strip (hidden when there's only one view) */}
      {views.length > 1 && (
        <div className="flex sm:flex-col gap-3" role="tablist" aria-label="Product images">
          {views.map((v, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View ${v.label}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative rounded-2xl overflow-hidden border-2 transition-all w-16 h-16 sm:w-20 sm:h-20 shrink-0",
                i === active
                  ? "border-brand shadow-brand"
                  : "border-line opacity-80 hover:opacity-100 hover:border-brand-light"
              )}
            >
              <ArtPlaceholder
                src={v.src}
                emoji={v.emoji}
                gradient={gradient}
                alt={product.name}
                className="h-full w-full"
                fontSize={30}
              />
            </button>
          ))}
        </div>
      )}

      {/* Hero stage */}
      <div
        ref={stageRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          setOffset({ x: 0, y: 0 });
        }}
        onMouseMove={onMove}
        className="relative flex-1 aspect-square rounded-brand overflow-hidden border border-line shadow-brand select-none cursor-zoom-in"
        style={{ background: `linear-gradient(160deg, ${gradient[0]}, ${gradient[1]})` }}
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
          {current.src ? (
            <Image
              src={current.src}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-contain"
              priority
            />
          ) : (
            <span aria-hidden className="leading-none drop-shadow-sm" style={{ fontSize: 200 }}>
              {current.emoji}
            </span>
          )}
        </div>

        {/* Subtle gloss + hint */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent" />
        <span className="pointer-events-none absolute bottom-3 right-4 text-[11px] text-ink/50 font-medium">
          Hover to zoom
        </span>
      </div>
    </div>
  );
}
