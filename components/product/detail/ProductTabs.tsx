"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type TabId = "description" | "ingredients" | "benefits" | "directions";

/**
 * Tabbed product info on desktop, stacked accordion on mobile.
 *
 * Reviews and FAQ deliberately live OUTSIDE this block — they are long enough
 * to deserve their own full-width sections further down the page (see
 * <ProductReviews> and <ProductFaq>) rather than being buried behind a tab.
 */
export function ProductTabs({ product }: { product: Product }) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const tabs: { id: TabId; label: string; content: ReactNode }[] = [
    { id: "description", label: "Description", content: <DescriptionPanel product={product} /> },
    { id: "ingredients", label: "Ingredients", content: <IngredientsPanel product={product} /> },
    { id: "benefits", label: "Benefits", content: <BenefitsPanel product={product} /> },
    { id: "directions", label: "Directions", content: <DirectionsPanel product={product} /> },
  ];

  const [active, setActive] = useState<TabId>("description");
  const [openMobile, setOpenMobile] = useState<TabId | null>("description");

  return (
    <section className="section-y bg-soft">
      <Container>
        {isMobile ? (
          /* ---- Mobile: stacked collapsible sections ---- */
          <div className="space-y-3">
            {tabs.map((t) => {
              const open = openMobile === t.id;
              return (
                <div
                  key={t.id}
                  className="rounded-brand border border-line bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenMobile(open ? null : t.id)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 font-bold text-left"
                  >
                    <span>{t.label}</span>
                    <span className={cn("text-brand text-xl transition-transform", open && "rotate-45")}>
                      +
                    </span>
                  </button>
                  {open && <div className="px-5 pb-6 animate-fadeIn">{t.content}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          /* ---- Desktop: tab bar + single panel ---- */
          <>
            <div
              role="tablist"
              aria-label="Product information"
              className="flex flex-wrap gap-1 border-b border-line mb-8"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active === t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors -mb-px border-b-2",
                    active === t.id
                      ? "border-brand text-brand"
                      : "border-transparent text-muted hover:text-ink"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-brand border border-line p-7 md:p-9 animate-fadeIn">
              {tabs.find((t) => t.id === active)?.content}
            </div>
          </>
        )}
      </Container>
    </section>
  );
}

/* ----------------------------- Panels ----------------------------- */

/** Shared heading so every panel opens the same way. */
function PanelHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="eyebrow">{eyebrow}</span>
      <h3 className="mt-1.5 text-xl font-bold text-ink md:text-2xl">{title}</h3>
      <span className="mt-3 block h-[3px] w-12 rounded-full bg-brand-light" aria-hidden />
    </div>
  );
}

function DescriptionPanel({ product }: { product: Product }) {
  // The copy is authored as blank-line separated paragraphs.
  const paragraphs = product.description.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="max-w-3xl">
      <PanelHeading eyebrow="The full story" title={`About ${product.name}`} />
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className={cn(
              "leading-relaxed text-muted",
              // Lead paragraph gets a little more presence.
              i === 0 && "text-[17px] font-medium text-ink"
            )}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function IngredientsPanel({ product }: { product: Product }) {
  return (
    <div>
      <PanelHeading eyebrow="Inside every capsule" title="Key ingredients" />
      <ul className="grid gap-4 sm:grid-cols-2">
        {product.ingredients.map((ing, i) => (
          <li
            key={ing.name}
            className="flex gap-4 rounded-brand border border-line bg-soft p-5 transition-colors hover:border-brand-light hover:bg-mint/40"
          >
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand ring-1 ring-line"
              aria-hidden
            >
              <Icon name={i % 2 === 0 ? "leaf" : "sprout"} size={18} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-bold text-ink">{ing.name}</span>
                {ing.amount && ing.amount !== "—" && (
                  <span className="chip chip-soft !text-[10px] shrink-0 italic">{ing.amount}</span>
                )}
              </div>
              {ing.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{ing.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BenefitsPanel({ product }: { product: Product }) {
  const rows =
    product.benefitDetails && product.benefitDetails.length > 0
      ? product.benefitDetails
      : product.benefits.map((b) => ({ title: b, description: "" }));

  return (
    <div className="max-w-3xl">
      <PanelHeading eyebrow="Why it works" title="Benefits" />
      {product.benefitsHeadline && (
        <p className="-mt-2 mb-6 text-[15px] leading-relaxed text-muted">
          {product.benefitsHeadline}
        </p>
      )}
      <ul className="space-y-3">
        {rows.map((b) => (
          <li
            key={b.title}
            className="flex items-start gap-3.5 rounded-brand border border-line bg-soft p-4"
          >
            <span
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"
              aria-hidden
            >
              <Icon name="check" size={14} />
            </span>
            <div className="min-w-0">
              <p className="font-semibold leading-snug text-ink">{b.title}</p>
              {b.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">{b.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DirectionsPanel({ product }: { product: Product }) {
  return (
    <div className="max-w-3xl">
      <PanelHeading eyebrow="Simple ritual" title="How to use" />
      <p className="leading-relaxed text-muted">{product.howToUse}</p>

      {product.howToUseSteps && product.howToUseSteps.length > 0 && (
        <ol className="mt-6 space-y-3">
          {product.howToUseSteps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3.5">
              <span
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-bold text-brand-dark"
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="font-semibold leading-snug text-ink">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-6 flex items-center gap-4 rounded-brand border border-brand-light/60 bg-mint p-5">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-brand"
          aria-hidden
        >
          <Icon name="clipboard-check" size={20} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Recommended dosage
          </p>
          <p className="font-bold text-ink">{product.dosage}</p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-muted">
        These statements are for wellness support and are not intended to diagnose, treat, cure or
        prevent any disease. Consult your physician if pregnant, nursing, or on medication.
      </p>
    </div>
  );
}
