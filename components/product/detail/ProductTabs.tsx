"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { Accordion } from "@/components/ui/Accordion";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ReviewsBlock } from "./ReviewsBlock";
import { generalFaq } from "@/data/faq";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type TabId = "description" | "ingredients" | "benefits" | "directions" | "reviews" | "faq";

/** Tabbed product info on desktop, stacked accordion on mobile. */
export function ProductTabs({ product }: { product: Product }) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const tabs: { id: TabId; label: string; content: ReactNode }[] = [
    { id: "description", label: "Description", content: <DescriptionPanel product={product} /> },
    { id: "ingredients", label: "Ingredients", content: <IngredientsPanel product={product} /> },
    { id: "benefits", label: "Benefits", content: <BenefitsPanel product={product} /> },
    { id: "directions", label: "Directions", content: <DirectionsPanel product={product} /> },
    { id: "reviews", label: "Reviews", content: <ReviewsBlock product={product} /> },
    {
      id: "faq",
      label: "FAQ",
      content: <Accordion items={product.faq && product.faq.length ? product.faq : generalFaq} />,
    },
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
                  id={t.id === "reviews" ? undefined : undefined}
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

function DescriptionPanel({ product }: { product: Product }) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-xl font-bold text-ink mb-3">About {product.name}</h3>
      <p className="text-muted leading-relaxed whitespace-pre-line">{product.description}</p>
    </div>
  );
}

function IngredientsPanel({ product }: { product: Product }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-ink mb-5">Key Ingredients</h3>
      <ul className="grid sm:grid-cols-2 gap-4">
        {product.ingredients.map((ing) => (
          <li key={ing.name} className="rounded-brand border border-line bg-soft p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-ink">{ing.name}</span>
              {ing.amount && <span className="chip chip-soft !text-[11px] shrink-0">{ing.amount}</span>}
            </div>
            {ing.description && <p className="text-sm text-muted mt-1.5">{ing.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BenefitsPanel({ product }: { product: Product }) {
  return (
    <div className="max-w-3xl">
      <h3 className="text-xl font-bold text-ink mb-5">Benefits</h3>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
        {product.benefits.map((b) => (
          <li key={b} className="flex items-start gap-3 text-ink">
            <span
              className="w-6 h-6 rounded-full bg-mint text-brand flex items-center justify-center shrink-0 mt-0.5"
              aria-hidden
            >
              <Icon name="check" size={14} className="text-brand" />
            </span>
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DirectionsPanel({ product }: { product: Product }) {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-xl font-bold text-ink mb-3">How to use</h3>
        <p className="text-muted leading-relaxed">{product.howToUse}</p>
      </div>
      <div className="rounded-brand bg-mint p-5 flex items-center gap-4">
        <span className="text-3xl" aria-hidden>📋</span>
        <div>
          <p className="text-xs uppercase tracking-wide text-brand-dark font-semibold">Recommended dosage</p>
          <p className="font-bold text-ink">{product.dosage}</p>
        </div>
      </div>
      <p className="text-xs text-muted">
        These statements are for wellness support and are not intended to diagnose, treat, cure or prevent
        any disease. Consult your physician if pregnant, nursing, or on medication.
      </p>
    </div>
  );
}
