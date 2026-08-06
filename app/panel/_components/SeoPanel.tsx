"use client";

import { useMemo, useState } from "react";
import { analyzeSeo, type CheckStatus } from "@/lib/seoAnalyzer";
import { Icon } from "@/app/panel/_components/Icon";

/**
 * Live SEO sidebar: how the page will look in Google and on social, plus a
 * scored checklist that updates as the writer types.
 *
 * It reads the form's current values rather than the saved record, so the
 * feedback is about what is being written right now — a score computed from the
 * last save would always be one edit stale and nobody would trust it.
 *
 * Analysis itself lives in lib/seoAnalyzer so the identical rules can run
 * server-side; this file is only presentation.
 */

/** Which form keys feed the preview, per resource. */
export interface SeoSourceKeys {
  /** Falls back to this when seoTitle is empty (e.g. "name" or "title"). */
  titleKey: string;
  /** Falls back to this when seoDescription is empty. */
  descriptionKey: string;
  /** Body HTML used for word count, headings, links, alt text. */
  contentKey?: string;
  slugKey?: string;
  imageKey?: string;
  /** URL prefix on the storefront, e.g. "/product/". */
  urlPrefix: string;
}

const STATUS_STYLE: Record<CheckStatus, { dot: string; text: string }> = {
  good: { dot: "bg-emerald-500", text: "text-emerald-700" },
  warn: { dot: "bg-amber-500", text: "text-amber-700" },
  bad: { dot: "bg-red-500", text: "text-red-700" },
};

function str(v: unknown): string {
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

/** Truncate the way a search engine does — on the character count, with an ellipsis. */
function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/* ------------------------------ score ring ------------------------------ */

function ScoreRing({ score }: { score: number }) {
  const tone =
    score >= 85 ? "#059669" : score >= 70 ? "#65a30d" : score >= 50 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 26;
  return (
    <div className="relative h-[70px] w-[70px] shrink-0">
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle cx="30" cy="30" r="26" fill="none" stroke="#e6ebe8" strokeWidth="7" />
        <circle
          cx="30"
          cy="30"
          r="26"
          fill="none"
          stroke={tone}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          className="transition-all duration-500"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-lg font-extrabold"
        style={{ color: tone }}
      >
        {score}
      </span>
    </div>
  );
}

/* ------------------------------- previews ------------------------------- */

function GooglePreview({
  url,
  title,
  description,
  mobile,
}: {
  url: string;
  title: string;
  description: string;
  mobile: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 ${mobile ? "max-w-[360px]" : ""}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-soft text-[10px] font-bold text-brand">
          M
        </span>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[12px] text-ink">Meenazo</div>
          <div className="truncate text-[11px] text-muted">{url}</div>
        </div>
      </div>
      <div className="text-[18px] leading-snug text-[#1a0dab] hover:underline">
        {clip(title, mobile ? 55 : 60) || "Untitled page"}
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-[#4d5156]">
        {clip(description, mobile ? 120 : 160) ||
          "No meta description — Google will pick a sentence from the page."}
      </p>
    </div>
  );
}

function SocialPreview({
  network,
  url,
  title,
  description,
  image,
}: {
  network: "Facebook" | "X / Twitter";
  url: string;
  title: string;
  description: string;
  image?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex aspect-[1.91/1] items-center justify-center bg-soft">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-xs text-muted">
            No share image set — the link will preview as plain text.
          </span>
        )}
      </div>
      <div className="border-t border-line px-3 py-2.5">
        <div className="text-[11px] uppercase tracking-wide text-muted">
          {url.replace(/^https?:\/\//, "").split("/")[0]}
        </div>
        <div className="mt-0.5 line-clamp-2 text-sm font-bold text-ink">
          {clip(title, 88) || "Untitled"}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{clip(description, 200)}</p>
      </div>
      <div className="border-t border-line px-3 py-1.5 text-[11px] font-medium text-muted">
        {network} preview
      </div>
    </div>
  );
}

/* -------------------------------- panel --------------------------------- */

export function SeoPanel({
  values,
  source,
}: {
  values: Record<string, unknown>;
  source: SeoSourceKeys;
}) {
  const [tab, setTab] = useState<"google" | "mobile" | "social">("google");

  const slug = str(values[source.slugKey ?? "slug"]);
  const url = `https://meenazo.com${source.urlPrefix}${slug || "…"}`;

  // Same inheritance the live site uses: explicit override, else the page's own
  // heading/summary. Preview a blank field and you would be lying to the writer.
  const title = str(values.seoTitle) || str(values[source.titleKey]);
  const description = str(values.seoDescription) || str(values[source.descriptionKey]);
  const image =
    str(values.ogImage) ||
    (source.imageKey ? str(values[source.imageKey]).split(",")[0]?.trim() : "");

  const analysis = useMemo(
    () =>
      analyzeSeo({
        title,
        description,
        content: source.contentKey ? str(values[source.contentKey]) : "",
        focusKeyword: str(values.focusKeyword),
        slug,
        hasImage: Boolean(image),
      }),
    [title, description, values, source.contentKey, slug, image]
  );

  const failing = analysis.checks.filter((c) => c.status !== "good");
  const passing = analysis.checks.filter((c) => c.status === "good");

  return (
    <div className="space-y-4">
      {/* -------------------------- score -------------------------- */}
      <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
        <ScoreRing score={analysis.score} />
        <div className="min-w-0">
          <p className="text-sm font-bold capitalize text-ink">
            {analysis.grade.replace("-", " ")}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            {failing.length === 0
              ? "Every check passed."
              : `${failing.length} thing${failing.length === 1 ? "" : "s"} to improve.`}
          </p>
          <p className="mt-1 text-[11px] text-muted">
            {analysis.stats.wordCount} words · {analysis.stats.readingTimeMin} min read ·{" "}
            {analysis.stats.charCount} chars
          </p>
        </div>
      </div>

      {/* ------------------------- previews ------------------------- */}
      <div className="rounded-xl border border-line bg-soft/50 p-3">
        <div className="mb-3 flex gap-1">
          {(
            [
              ["google", "Google"],
              ["mobile", "Mobile"],
              ["social", "Social"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                tab === id ? "bg-brand text-white" : "text-muted hover:bg-white hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "google" && (
          <GooglePreview url={url} title={title} description={description} mobile={false} />
        )}
        {tab === "mobile" && (
          <GooglePreview url={url} title={title} description={description} mobile />
        )}
        {tab === "social" && (
          <div className="space-y-3">
            <SocialPreview
              network="Facebook"
              url={url}
              title={str(values.ogTitle) || title}
              description={str(values.ogDescription) || description}
              image={image}
            />
            <SocialPreview
              network="X / Twitter"
              url={url}
              title={str(values.twitterTitle) || str(values.ogTitle) || title}
              description={
                str(values.twitterDescription) || str(values.ogDescription) || description
              }
              image={str(values.twitterImage) || image}
            />
          </div>
        )}
      </div>

      {/* -------------------------- checks -------------------------- */}
      <div className="rounded-xl border border-line bg-white">
        <p className="border-b border-line px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted">
          Analysis
        </p>
        <ul className="divide-y divide-line">
          {[...failing, ...passing].map((c) => {
            const s = STATUS_STYLE[c.status];
            return (
              <li key={c.id} className="flex gap-2.5 px-4 py-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} aria-hidden />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink">{c.label}</p>
                  <p className={`text-xs leading-relaxed ${s.text}`}>{c.message}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
        <Icon name="help" size={13} className="mt-px shrink-0" />
        Blank SEO fields inherit — the page title and description are used, then the global
        defaults. Nothing is ever published empty.
      </p>
    </div>
  );
}
