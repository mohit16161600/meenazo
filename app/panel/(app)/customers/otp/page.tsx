"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "../../../_lib/api";
import { Badge, Button, PageHeader, TableSkeleton } from "../../../_components/ui";
import { Icon } from "../../../_components/Icon";
import { MetricTile } from "../../../_components/charts";
import { formatPrice } from "@/utils/format";

/** One mobile number, with every OTP it ever asked for rolled into a single row. */
interface OtpLead {
  phone: string;
  attempts: number;
  firstAt: string | null;
  lastAt: string | null;
  lastCode: string | null;
  lastChannel: string;
  lastIp: string | null;
  purposes: string;
  isCustomer: boolean;
  name: string | null;
  email: string | null;
  verified: boolean;
  customerSince: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  ordersCount: number;
  totalSpent: number;
  stage: "otp_only" | "no_order" | "ordered";
}

type Tab = "all" | "otp_only" | "no_order" | "ordered";

const fmtDate = (s: string | null) => (s ? String(s).slice(0, 16).replace("T", " ") : " - ");

/** "2 days ago" style hint — the owner cares how cold a lead is, not the exact stamp. */
function ago(s: string | null): string {
  if (!s) return "";
  const t = new Date(String(s).replace(" ", "T")).getTime();
  if (!Number.isFinite(t)) return "";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 31 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
}

const STAGE_META: Record<OtpLead["stage"], { label: string; tone: "amber" | "blue" | "green" }> = {
  otp_only: { label: "Only OTP", tone: "amber" },
  no_order: { label: "Signed up", tone: "blue" },
  ordered: { label: "Ordered", tone: "green" },
};

export default function OtpAttemptsPage() {
  const [q, setQ] = useState("");
  const [leads, setLeads] = useState<OtpLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("otp_only");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ leads: OtpLead[] }>(
        `/customers/otp${query ? `?q=${encodeURIComponent(query)}` : ""}`
      );
      setLeads(res.leads ?? []);
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Could not load OTP attempts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(
    () => ({
      otpOnly: leads.filter((l) => l.stage === "otp_only").length,
      noOrder: leads.filter((l) => l.stage === "no_order").length,
      ordered: leads.filter((l) => l.stage === "ordered").length,
      sends: leads.reduce((n, l) => n + l.attempts, 0),
    }),
    [leads]
  );

  const filtered = useMemo(
    () => (tab === "all" ? leads : leads.filter((l) => l.stage === tab)),
    [leads, tab]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  /** Export whatever is in view — this list is a call-list, so it has to leave the panel. */
  function exportCsv() {
    const esc = (v: unknown) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((l) =>
      [
        l.phone,
        STAGE_META[l.stage].label,
        l.attempts,
        l.firstAt ?? "",
        l.lastAt ?? "",
        l.lastChannel,
        l.name ?? "",
        l.email ?? "",
        l.lastLoginAt ?? "",
        l.loginCount,
        l.ordersCount,
        l.totalSpent,
      ]
        .map(esc)
        .join(",")
    );
    const url = URL.createObjectURL(
      new Blob(
        [
          "﻿" +
            [
              "Phone,Stage,OTP attempts,First attempt,Last attempt,Channel,Name,Email,Last login,Logins,Orders,Spent",
              ...rows,
            ].join("\n"),
        ],
        { type: "text/csv;charset=utf-8;" }
      )
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `meenazo-otp-attempts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load(q.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="OTP attempts"
        subtitle="Every mobile number that requested an OTP — when, how many times, and whether an account or order followed."
        actions={
          <div className="flex gap-2">
            <Link
              href="/panel/customers"
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <Icon name="users" size={16} /> Customers
            </Link>
            <Button variant="outline" icon="upload" onClick={exportCsv} disabled={filtered.length === 0}>
              Export CSV
            </Button>
          </div>
        }
      />

      <form onSubmit={onSearch} className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by mobile number…"
          aria-label="Search OTP attempts by mobile number"
          className="min-h-[44px] w-full max-w-md rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
        />
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2"
        >
          Search
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(1);
              load();
            }}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Numbers" value={String(leads.length)} icon={<Icon name="users" size={16} />} tone="brand" />
        <MetricTile label="Only OTP (no account)" value={String(summary.otpOnly)} icon={<Icon name="shield-check" size={16} />} tone="amber" />
        <MetricTile label="Signed up, no order" value={String(summary.noOrder)} icon={<Icon name="users" size={16} />} tone="blue" />
        <MetricTile label="OTPs sent" value={String(summary.sends)} icon={<Icon name="message" size={16} />} tone="violet" />
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line p-3">
          {([
            { key: "otp_only", label: "Only OTP", count: summary.otpOnly },
            { key: "no_order", label: "Signed up, no order", count: summary.noOrder },
            { key: "ordered", label: "Ordered", count: summary.ordered },
            { key: "all", label: "All", count: leads.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              aria-pressed={tab === t.key}
              className={
                "inline-flex min-h-[38px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
                (tab === t.key ? "bg-brand text-white" : "text-muted hover:bg-soft hover:text-ink")
              }
            >
              {t.label}
              <span className={"rounded-full px-1.5 text-[11px] font-bold " + (tab === t.key ? "bg-white/25" : "bg-soft")}>
                {t.count}
              </span>
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted">
            Show
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="min-h-[44px] rounded-xl border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint text-brand">
              <Icon name="shield-check" size={26} />
            </div>
            <p className="mt-4 font-semibold text-ink">
              {tab === "otp_only" ? "Nobody stuck at the OTP screen" : "Nothing in this group"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              {leads.length === 0
                ? "Numbers appear here the moment someone requests a login OTP on the website."
                : "Switch to the All tab to see every number that requested an OTP."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-soft/70 text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-semibold">Number</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 text-right font-semibold">Attempts</th>
                    <th className="px-4 py-3 font-semibold">First attempt</th>
                    <th className="px-4 py-3 font-semibold">Last attempt</th>
                    <th className="px-4 py-3 font-semibold">Channel</th>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Verified / logged in</th>
                    <th className="px-4 py-3 text-right font-semibold">Orders</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((l) => {
                    const meta = STAGE_META[l.stage];
                    return (
                      <tr key={l.phone} className="border-b border-line/60 last:border-0 hover:bg-soft/70">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-ink">{l.phone}</span>
                          {l.lastIp && <span className="ml-2 text-[11px] text-muted">{l.lastIp}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-semibold">{l.attempts}</td>
                        <td className="px-4 py-3 text-xs text-muted">{fmtDate(l.firstAt)}</td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {fmtDate(l.lastAt)}
                          <span className="ml-1.5 text-[11px] text-muted/80">{ago(l.lastAt)}</span>
                        </td>
                        <td className="px-4 py-3 text-xs uppercase text-muted">{l.lastChannel || "-"}</td>
                        <td className="px-4 py-3 text-ink">
                          {l.name || <span className="text-muted">-</span>}
                          {l.email && <span className="block text-[11px] text-muted">{l.email}</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">
                          {l.lastLoginAt ? (
                            <>
                              {fmtDate(l.lastLoginAt)}
                              {l.loginCount > 0 && <span className="ml-1">· {l.loginCount}×</span>}
                            </>
                          ) : (
                            <span className="font-semibold text-amber-600">Never</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {l.ordersCount}
                          {l.ordersCount > 0 && (
                            <span className="block text-[11px] text-muted">{formatPrice(l.totalSpent)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/91${l.phone.replace(/\D/g, "").slice(-10)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Message on WhatsApp"
                              className="inline-flex min-h-[38px] items-center rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                            >
                              WhatsApp
                            </a>
                            {l.isCustomer && (
                              <Link
                                href={`/panel/customers?phone=${encodeURIComponent(l.phone)}`}
                                className="inline-flex min-h-[38px] items-center rounded-xl border border-line px-3 py-1.5 text-xs font-semibold text-brand hover:bg-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                              >
                                History
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
              <span className="text-xs text-muted" aria-live="polite">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </span>
              {pageCount > 1 && (
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="inline-flex h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-sm text-muted">
                    Page {page} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    className="inline-flex h-9 items-center rounded-xl border border-line px-3 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-muted">
        “Only OTP” means the number requested a code but never verified it. An account is only
        created once an OTP is verified, so the absence of a customers row is the reliable signal.
        The code&apos;s “used/unused” status is deliberately not shown here: sending a new OTP
        consumes the previous one automatically, so it is not a trustworthy sign of verification.
      </p>
      <div className="h-6" />
    </div>
  );
}
