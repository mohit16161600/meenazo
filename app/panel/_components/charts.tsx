"use client";

import { useId, useMemo, useState } from "react";
import { clsx } from "clsx";

/**
 * Panel charts - plain SVG, no dependencies.
 *
 * Colour note: the Meenazo brand green (#5b8c6e) is deliberately NOT used for
 * data marks - at chroma 0.07 it fails the categorical floor and reads grey in
 * a chart. Brand green stays on UI chrome; data wears the validated palette
 * below (slots 1-3 clear every all-pairs CVD/normal-vision gate on white).
 * Aqua sits under 3:1 on white, so every mark using it carries a direct label.
 */
export const VIZ = {
  series1: "#2a78d6", // blue
  series2: "#eb6834", // orange
  series3: "#1baf7a", // aqua
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  muted: "#898781",
  surface: "#ffffff",
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const compact = (n: number) =>
  n >= 1_00_00_000
    ? `₹${(n / 1_00_00_000).toFixed(1)}Cr`
    : n >= 1_00_000
      ? `₹${(n / 1_00_000).toFixed(1)}L`
      : n >= 1_000
        ? `₹${Math.round(n / 1000)}K`
        : `₹${Math.round(n)}`;

/* ------------------------------- Trend ---------------------------------- */

export interface TrendPoint {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Revenue over time - one series, so no legend box (the heading names it).
 * Area wash at 10%, 2px line, hover crosshair + tooltip, and a single direct
 * label on the peak rather than a number on every point.
 */
export function TrendChart({ data, height = 220 }: { data: TrendPoint[]; height?: number }) {
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const W = 760;
  const H = height;
  const PAD = { top: 18, right: 16, bottom: 26, left: 52 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { pts, max, ticks, peakIdx } = useMemo(() => {
    const values = data.map((d) => d.revenue);
    const rawMax = Math.max(1, ...values);
    // Round the axis top to a clean number so ticks read 0 / 5,000 / 10,000.
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const niceMax = Math.ceil(rawMax / (mag / 2)) * (mag / 2);
    const n = data.length;
    const x = (i: number) => (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
    const y = (v: number) => plotH - (v / niceMax) * plotH;
    return {
      pts: data.map((d, i) => ({ ...d, x: x(i), y: y(d.revenue) })),
      max: niceMax,
      ticks: [0, niceMax / 2, niceMax],
      peakIdx: values.indexOf(rawMax),
    };
  }, [data, plotW, plotH]);

  if (!data.length) return <EmptyPlot label="No data for this period" height={height} />;

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${plotH} L${pts[0].x.toFixed(1)},${plotH} Z`;
  const active = hover !== null ? pts[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={VIZ.series1} stopOpacity="0.16" />
            <stop offset="100%" stopColor={VIZ.series1} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={plotH - (t / max) * plotH} y2={plotH - (t / max) * plotH} stroke={VIZ.grid} strokeWidth={1} />
              <text x={-10} y={plotH - (t / max) * plotH + 4} textAnchor="end" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                {compact(t)}
              </text>
            </g>
          ))}

          <path d={area} fill={`url(#g${gid})`} />
          <path d={line} fill="none" stroke={VIZ.series1} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* One direct label - the peak - instead of a value on every point. */}
          {pts[peakIdx] && data[peakIdx].revenue > 0 && (
            <text
              x={Math.min(Math.max(pts[peakIdx].x, 22), plotW - 22)}
              y={Math.max(pts[peakIdx].y - 10, 10)}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill="#52514e"
            >
              {compact(data[peakIdx].revenue)}
            </text>
          )}

          {active && (
            <>
              <line x1={active.x} x2={active.x} y1={0} y2={plotH} stroke={VIZ.axis} strokeWidth={1} />
              <circle cx={active.x} cy={active.y} r={5} fill={VIZ.series1} stroke={VIZ.surface} strokeWidth={2} />
            </>
          )}

          <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke={VIZ.axis} strokeWidth={1} />
          {pts.map((p, i) =>
            i === 0 || i === pts.length - 1 || (pts.length > 8 && i === Math.floor(pts.length / 2)) ? (
              <text key={p.date} x={p.x} y={plotH + 16} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} fontSize={11} fill={VIZ.muted}>
                {p.date.slice(5)}
              </text>
            ) : null
          )}

          {/* Hit areas are a full column wide so the pointer never has to find
              the 2px line itself. */}
          {pts.map((p, i) => (
            <rect
              key={`h${p.date}`}
              x={p.x - plotW / Math.max(1, pts.length - 1) / 2}
              y={0}
              width={plotW / Math.max(1, pts.length - 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </g>
      </svg>

      {active && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((PAD.left + active.x) / W) * 100}%`,
            top: 8,
            transform: `translateX(${active.x > plotW * 0.6 ? "-105%" : "8px"})`,
          }}
        >
          <div className="font-semibold text-ink">{active.date}</div>
          <div className="mt-1 flex items-center gap-1.5 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: VIZ.series1 }} />
            {inr(active.revenue)} · {active.orders} {active.orders === 1 ? "order" : "orders"}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Bar list -------------------------------- */

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
  /** Small text under the label (e.g. "12 orders · ₹4,000 due"). */
  hint?: string;
  href?: string;
}

/**
 * Horizontal bars - the safe form for ranked magnitudes. Every bar carries its
 * value as a direct label (which is also the relief for the aqua slot's
 * sub-3:1 contrast), so nothing depends on hue alone.
 */
export function BarList({
  data,
  format = (v: number) => String(v),
  emptyLabel = "Nothing yet",
}: {
  data: BarDatum[];
  format?: (v: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (!data.length || data.every((d) => d.value === 0)) {
    return <p className="py-6 text-center text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
              <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: d.color ?? VIZ.series1 }} aria-hidden />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="flex-none text-sm font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
              {format(d.value)}
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-r-[4px]"
              style={{ width: `${Math.max(2, (d.value / max) * 100)}%`, background: d.color ?? VIZ.series1 }}
            />
          </div>
          {d.hint && <p className="mt-1 text-xs text-muted">{d.hint}</p>}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Share bar ------------------------------- */

export interface ShareSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * A single 100% bar for part-to-whole. Segments are separated by a 2px gap in
 * the surface colour (white does the separating - no strokes), and a legend is
 * always present since there are two or more series.
 */
export function ShareBar({ segments, format }: { segments: ShareSegment[]; format: (v: number) => string }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  if (total <= 0) return <p className="py-4 text-center text-sm text-muted">No orders in this period</p>;
  const shown = segments.filter((s) => s.value > 0);

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {shown.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${format(s.value)}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
            <span className="text-muted">{s.label}</span>
            <span className="font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
              {total > 0 ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Stat tile ------------------------------- */

export function StatTile({
  label,
  value,
  delta,
  hint,
  icon,
  href,
  tone = "brand",
}: {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  tone?: "brand" | "blue" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    brand: "bg-mint text-brand",
    blue: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };
  const body = (
    <>
      <div className="flex items-start justify-between">
        {icon && <span className={clsx("flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>{icon}</span>}
        {delta !== undefined && delta !== null && (
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta > 0 ? "bg-emerald-50 text-emerald-700" : delta < 0 ? "bg-red-50 text-red-600" : "bg-soft text-muted"
            )}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : " - "} {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold text-ink">{value}</div>
      <div className="text-sm text-muted">{label}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </>
  );
  return href ? (
    <a href={href} className="block rounded-xl border border-line bg-white p-5 transition-shadow hover:shadow-brand">
      {body}
    </a>
  ) : (
    <div className="rounded-xl border border-line bg-white p-5">{body}</div>
  );
}

/* ------------------------------ Metric tile ------------------------------ */

/**
 * Dense KPI tile: label + previous-period value on one line, the figure below,
 * and a signed delta chip. Built for a grid of many metrics, where the taller
 * StatTile would waste the screen.
 *
 * `prev` is the same measure over the previous window of equal length, so the
 * percentage is a real comparison, not decoration. When there is nothing to
 * compare against (prev = 0) no chip is shown rather than a fake "+100%".
 */
export function MetricTile({
  label,
  value,
  prev,
  icon,
  tone = "brand",
  href,
  invert = false,
}: {
  label: string;
  value: string;
  prev?: string | number | null;
  icon?: React.ReactNode;
  tone?: "brand" | "blue" | "amber" | "red" | "violet" | "slate";
  href?: string;
  /** true when going UP is bad (cancellations, unverified users). */
  invert?: boolean;
}) {
  const tones: Record<string, string> = {
    brand: "bg-mint text-brand",
    blue: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    violet: "bg-violet-50 text-violet-600",
    slate: "bg-slate-100 text-slate-500",
  };

  // Only compute a delta when both sides are real numbers.
  const prevNum = typeof prev === "number" ? prev : NaN;
  const curNum = Number(String(value).replace(/[^\d.-]/g, ""));
  const hasDelta = Number.isFinite(prevNum) && prevNum > 0 && Number.isFinite(curNum);
  const delta = hasDelta ? Math.round(((curNum - prevNum) / prevNum) * 100) : null;
  const good = delta === null ? null : invert ? delta <= 0 : delta >= 0;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {icon && (
            <span className={clsx("flex h-8 w-8 flex-none items-center justify-center rounded-xl", tones[tone])}>
              {icon}
            </span>
          )}
          <span className="truncate text-xs font-medium text-muted">{label}</span>
        </div>
        {prev !== undefined && prev !== null && (
          <span className="flex-none text-[11px] text-muted">Prev: {typeof prev === "number" ? prev.toLocaleString("en-IN") : prev}</span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-[22px] font-bold leading-none text-ink">{value}</span>
        {delta !== null && (
          <span
            className={clsx(
              "flex-none rounded-full px-2 py-0.5 text-[11px] font-bold",
              delta === 0
                ? "bg-soft text-muted"
                : good
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
            )}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}%
          </span>
        )}
      </div>
    </>
  );

  const cls =
    "block rounded-xl border border-line bg-white p-5 transition-shadow" + (href ? " hover:shadow-brand" : "");
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ------------------------------ Pipeline --------------------------------- */

/**
 * Order pipeline as ONE card instead of nine separate tiles.
 *
 * Nine same-sized tiles give every stage equal visual weight and swamp the
 * page; a single strip keeps the whole funnel readable at a glance, with a
 * proportional bar carrying the magnitude and the colour carrying the state.
 */
export function Pipeline({
  stages,
}: {
  stages: { key: string; label: string; value: number; prev: number; color: string; href?: string }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {stages.map((s) => {
        const delta = s.prev > 0 ? Math.round(((s.value - s.prev) / s.prev) * 100) : null;
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm text-muted">{s.label}</span>
              <span className="text-lg font-bold text-ink" style={{ fontVariantNumeric: "tabular-nums" }}>
                {s.value}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-soft">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(3, (s.value / max) * 100)}%`, background: s.color }}
              />
            </div>
            {delta !== null && (
              <span className="mt-1.5 block text-[11px] text-muted">
                Prev {s.prev} · {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </>
        );
        return (
          <li key={s.key}>
            {s.href ? (
              <a href={s.href} className="block rounded-xl p-1 transition-colors hover:bg-soft/70">
                {inner}
              </a>
            ) : (
              <div className="p-1">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* --------------------------- Big figure tile ----------------------------- */

/**
 * The one number a section leads with. Deliberately larger than the tiles
 * around it - a dashboard needs a focal point, not a wall of equal weights.
 */
export function HeroFigure({
  label,
  value,
  sub,
  delta,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-gradient-to-br from-mint to-white p-6">
      <div className="flex items-center gap-2 text-sm font-medium text-muted">
        {icon && <span className="text-brand">{icon}</span>}
        {label}
      </div>
      <div className="mt-3 text-[34px] font-bold leading-none text-ink">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {delta !== null && delta !== undefined && (
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              delta > 0 ? "bg-emerald-100 text-emerald-800" : delta < 0 ? "bg-red-100 text-red-700" : "bg-white text-muted"
            )}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)}%
          </span>
        )}
        {sub && <span className="text-xs text-muted">{sub}</span>}
      </div>
    </div>
  );
}

/* --------------------------- Multi-series lines --------------------------- */

export interface Series {
  key: string;
  label: string;
  color: string;
}

/**
 * Several measures of the SAME unit on ONE axis (never a second y-scale - two
 * scales let any two lines be made to say anything). A legend is always
 * present, and the hover column reports every series at that x.
 */
export function MultiLineChart({
  data,
  series,
  height = 260,
  xKey = "date",
  format = (v: number) => String(v),
}: {
  data: Record<string, unknown>[];
  series: Series[];
  height?: number;
  xKey?: string;
  format?: (v: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 900;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 28, left: 56 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const { max, ticks, xOf, yOf } = useMemo(() => {
    const values = data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)));
    const rawMax = Math.max(1, ...values);
    const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const niceMax = Math.max(1, Math.ceil(rawMax / (mag / 2)) * (mag / 2));
    const count = data.length;
    return {
      max: niceMax,
      ticks: [0, niceMax / 2, niceMax],
      xOf: (i: number) => (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW),
      yOf: (v: number) => plotH - (v / niceMax) * plotH,
    };
  }, [data, series, plotW, plotH]);

  if (!data.length) return <EmptyPlot label="No data for this period" height={height} />;
  const active = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
            {s.label}
          </li>
        ))}
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} role="img" aria-label="Trend over time">
        <g transform={`translate(${PAD.left},${PAD.top})`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={0} x2={plotW} y1={yOf(t)} y2={yOf(t)} stroke={VIZ.grid} strokeWidth={1} />
              <text x={-10} y={yOf(t) + 4} textAnchor="end" fontSize={11} fill={VIZ.muted} style={{ fontVariantNumeric: "tabular-nums" }}>
                {format(t)}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path
              key={s.key}
              d={data.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(Number(d[s.key] ?? 0)).toFixed(1)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {active && hover !== null && (
            <>
              <line x1={xOf(hover)} x2={xOf(hover)} y1={0} y2={plotH} stroke={VIZ.axis} strokeWidth={1} />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={xOf(hover)}
                  cy={yOf(Number(active[s.key] ?? 0))}
                  r={4.5}
                  fill={s.color}
                  stroke={VIZ.surface}
                  strokeWidth={2}
                />
              ))}
            </>
          )}
          <line x1={0} x2={plotW} y1={plotH} y2={plotH} stroke={VIZ.axis} strokeWidth={1} />
          {data.map((d, i) =>
            i === 0 || i === data.length - 1 || (data.length > 6 && i === Math.floor(data.length / 2)) ? (
              <text
                key={i}
                x={xOf(i)}
                y={plotH + 18}
                textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
                fontSize={11}
                fill={VIZ.muted}
              >
                {String(d[xKey] ?? "").slice(5)}
              </text>
            ) : null
          )}
          {data.map((d, i) => (
            <rect
              key={`h${i}`}
              x={xOf(i) - plotW / Math.max(1, data.length - 1) / 2}
              y={0}
              width={plotW / Math.max(1, data.length - 1)}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </g>
      </svg>
      {active && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: `${((PAD.left + xOf(hover)) / W) * 100}%`,
            top: 30,
            transform: `translateX(${xOf(hover) > plotW * 0.6 ? "-105%" : "8px"})`,
          }}
        >
          <div className="font-semibold text-ink">{String(active[xKey])}</div>
          {series.map((s) => (
            <div key={s.key} className="mt-1 flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}: <span className="font-semibold text-ink">{format(Number(active[s.key] ?? 0))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Column chart ----------------------------- */

/**
 * Vertical columns for a handful of categories. 24px cap, 4px rounded cap,
 * square at the baseline, value labelled on top - no axis needed for 2-6 bars.
 */
export function ColumnChart({
  data,
  height = 220,
  format = (v: number) => String(v),
}: {
  data: { label: string; value: number; color: string }[];
  height?: number;
  format?: (v: number) => string;
}) {
  if (!data.length || data.every((d) => d.value === 0))
    return <EmptyPlot label="No data for this period" height={height} />;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ height }} className="flex items-end justify-around gap-6 px-2">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end">
          <span className="mb-2 text-xs font-bold text-ink">{format(d.value)}</span>
          <div
            className="w-full max-w-[56px] rounded-t-[4px]"
            style={{ height: `${Math.max(2, (d.value / max) * 78)}%`, background: d.color }}
          />
          <span className="mt-2 text-xs text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function EmptyPlot({ label, height }: { label: string; height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-muted" style={{ height }}>
      {label}
    </div>
  );
}

export { inr, compact };
