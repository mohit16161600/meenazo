"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  LinkButton,
  PageHeader,
  SegmentedToggle,
  Switch,
  TableSkeleton,
} from "./ui";
import { Icon } from "./Icon";
import { useToast } from "./toast";
import { getResource } from "../_lib/specs";
import { apiGet, apiDelete, apiPut, type ApiError } from "../_lib/api";

export function ResourceListPage({ resourceName }: { resourceName: string }) {
  const cfg = getResource(resourceName)!;
  const toast = useToast();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "on" | "off">("all");
  const [perPage, setPerPage] = useState(20);
  const [page, setPage] = useState(1);

  const idOf = (r: Record<string, unknown>) => String(r[cfg.pkKey]);
  const statusKey = cfg.statusField ?? cfg.activeField;

  // Card layout is derived from the SAME column spec as the table: the "_img"
  // column is the thumbnail, the first ordinary column is the title, inline
  // controls become labelled rows, everything else becomes a detail pair.
  const isControl = (c: (typeof cfg.columns)[number]) => !!(c.segmented || c.toggle || c.selectOptions);
  const imageCol = cfg.columns.find((c) => c.key === "_img");
  const ordinary = cfg.columns.filter((c) => c.key !== "_img" && !isControl(c));
  const titleCol = ordinary[0];
  const detailCols = ordinary.slice(1);
  const controlCols = cfg.columns.filter(isControl);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: Record<string, unknown>[] }>(`/${cfg.name}`);
      setRows(res.items ?? []);
      setSelected(new Set());
    } catch (e) {
      // Kept on the page (not only in a toast) so the reader still sees why the
      // table is empty after the toast has gone.
      setError((e as ApiError).message ?? "Could not load this list.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.name]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = q
      ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
      : rows;
    if (statusKey && tab !== "all") {
      list = list.filter((r) => (tab === "on" ? !!r[statusKey] : !r[statusKey]));
    }
    return list;
  }, [rows, q, tab, statusKey]);

  // Any filter change puts the reader back on page 1 - staying on page 4 of a
  // list that now has one page reads as "no results".
  useEffect(() => {
    setPage(1);
  }, [q, tab, perPage]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  const tabCounts = useMemo(() => {
    if (!statusKey) return null;
    const base = q ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())) : rows;
    return {
      all: base.length,
      on: base.filter((r) => !!r[statusKey]).length,
      off: base.filter((r) => !r[statusKey]).length,
    };
  }, [rows, q, statusKey]);

  // "Select all" means the rows actually on screen, not the whole filtered set -
  // ticking a header box must never act on rows the reader cannot see.
  const allChecked = visible.length > 0 && visible.every((r) => selected.has(idOf(r)));
  const someChecked = selected.size > 0;

  function toggleSelectAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map(idOf)));
    }
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /* ------------------ inline field updates (optimistic + revert) ------------------ */
  async function updateField(
    row: Record<string, unknown>,
    key: string,
    value: unknown,
    revert: unknown
  ) {
    const id = idOf(row);
    setRows((prev) => prev.map((r) => (idOf(r) === id ? { ...r, [key]: value } : r)));
    try {
      await apiPut(`/${cfg.name}/${encodeURIComponent(id)}`, { [key]: value });
    } catch (e) {
      setRows((prev) => prev.map((r) => (idOf(r) === id ? { ...r, [key]: revert } : r)));
      toast.push("error", (e as ApiError).message ?? "Update failed.");
    }
  }
  const toggleField = (row: Record<string, unknown>, key: string, value: boolean) =>
    updateField(row, key, value, !value);

  /* ----------------------------- single delete ----------------------------- */
  async function remove(row: Record<string, unknown>) {
    const id = idOf(row);
    if (!confirm(`Delete this ${cfg.singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await apiDelete(`/${cfg.name}/${encodeURIComponent(id)}`);
      setRows((prev) => prev.filter((r) => idOf(r) !== id));
      toast.push("success", `${cfg.singular} deleted.`);
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Delete failed.");
    }
  }

  /* ------------------------------ bulk actions ----------------------------- */
  async function bulkSetActive(value: boolean) {
    if (!cfg.activeField || !someChecked) return;
    const ids = [...selected];
    setBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => apiPut(`/${cfg.name}/${encodeURIComponent(id)}`, { [cfg.activeField!]: value }))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    setRows((prev) =>
      prev.map((r) => (selected.has(idOf(r)) ? { ...r, [cfg.activeField!]: value } : r))
    );
    setSelected(new Set());
    setBusy(false);
    toast.push("success", `${ok} ${value ? "activated" : "deactivated"}.`);
  }

  async function bulkDelete() {
    if (!someChecked) return;
    if (!confirm(`Delete ${selected.size} selected ${cfg.title.toLowerCase()}? This cannot be undone.`))
      return;
    const ids = [...selected];
    setBusy(true);
    const results = await Promise.allSettled(
      ids.map((id) => apiDelete(`/${cfg.name}/${encodeURIComponent(id)}`))
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    setRows((prev) => prev.filter((r) => !selected.has(idOf(r))));
    setSelected(new Set());
    setBusy(false);
    toast.push("success", `${ok} deleted.`);
  }

  const colSpan = cfg.columns.length + 2;

  return (
    <div>
      <PageHeader
        title={cfg.title}
        subtitle={`${rows.length} ${rows.length === 1 ? cfg.singular.toLowerCase() : cfg.title.toLowerCase()} total`}
        actions={
          !cfg.hideCreate ? (
            <LinkButton href={`/panel/${cfg.name}/new`} icon="plus">
              New {cfg.singular.toLowerCase()}
            </LinkButton>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={16} />
            </span>
            <input
              className="min-h-[44px] w-64 max-w-full rounded-xl border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/25"
              placeholder={`Search ${cfg.title.toLowerCase()}…`}
              aria-label={`Search ${cfg.title.toLowerCase()}`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <Icon name="refresh" size={15} /> Refresh
          </button>

          <label className="ml-auto flex items-center gap-2 text-xs text-muted">
            Show
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              aria-label="Rows per page"
              className="min-h-[44px] rounded-xl border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n} per page
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Status tabs - only for resources that actually have an on/off field. */}
        {statusKey && tabCounts && (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2.5">
            {([
              { key: "all", label: "All", count: tabCounts.all },
              { key: "on", label: cfg.statusOnLabel ?? "Active", count: tabCounts.on },
              { key: "off", label: cfg.statusOffLabel ?? "Inactive", count: tabCounts.off },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={
                  "inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 " +
                  (tab === t.key ? "bg-brand text-white" : "text-muted hover:bg-soft hover:text-ink")
                }
              >
                {t.label}
                <span
                  className={
                    "rounded-full px-1.5 text-[11px] font-bold " +
                    (tab === t.key ? "bg-white/25 text-white" : "bg-soft text-muted")
                  }
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Bulk action bar */}
        {someChecked && (
          <div className="flex flex-wrap items-center gap-2 border-b border-brand/20 bg-mint/60 px-4 py-2.5">
            <span className="text-sm font-semibold text-brand-dark">
              {selected.size} selected
            </span>
            <div className="mx-1 h-4 w-px bg-brand/20" />
            {cfg.activeField && (
              <>
                <Button variant="outline" onClick={() => bulkSetActive(true)} loading={busy} className="!py-1.5 !px-3 text-xs">
                  <Icon name="check" size={14} /> Activate
                </Button>
                <Button variant="outline" onClick={() => bulkSetActive(false)} loading={busy} className="!py-1.5 !px-3 text-xs">
                  <Icon name="x" size={14} /> Deactivate
                </Button>
              </>
            )}
            <Button variant="danger" onClick={bulkDelete} loading={busy} className="!py-1.5 !px-3 text-xs">
              <Icon name="trash" size={14} /> Delete
            </Button>
            <button
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs font-medium text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <TableSkeleton rows={5} cols={Math.min(5, cfg.columns.length + 1)} />
        ) : error ? (
          <ErrorState
            title={`${cfg.title} couldn't load`}
            message={`${error} Check your connection, then try again.`}
            onRetry={load}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={cfg.icon}
            title={q || tab !== "all" ? "Nothing matches these filters" : `No ${cfg.title.toLowerCase()} yet`}
            hint={
              q || tab !== "all"
                ? "Try a different search, or switch back to the All tab."
                : `Create your first ${cfg.singular.toLowerCase()} to get started.`
            }
            action={
              !cfg.hideCreate && !q && tab === "all" ? (
                <LinkButton href={`/panel/${cfg.name}/new`} icon="plus">
                  New {cfg.singular.toLowerCase()}
                </LinkButton>
              ) : undefined
            }
          />
        ) : cfg.cards ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((row) => {
              const id = idOf(row);
              const checked = selected.has(id);
              return (
                <article
                  key={id}
                  className={
                    "rounded-xl border p-4 transition-colors " +
                    (checked ? "border-brand/40 bg-mint/40" : "border-line bg-white hover:border-brand/30")
                  }
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 flex-none cursor-pointer accent-brand"
                      checked={checked}
                      onChange={() => toggleOne(id)}
                      aria-label={`Select ${cfg.singular.toLowerCase()}`}
                    />
                    {imageCol && <div className="flex-none">{imageCol.render?.(row)}</div>}
                    <div className="min-w-0 flex-1">
                      {titleCol?.render ? titleCol.render(row) : <span className="font-semibold text-ink">{String(row[titleCol?.key ?? "name"] ?? id)}</span>}
                    </div>
                    <div className="flex flex-none gap-1">
                      <IconButton icon="edit" title="Edit" href={`/panel/${cfg.name}/${encodeURIComponent(id)}`} />
                      <IconButton icon="trash" title="Delete" tone="danger" onClick={() => remove(row)} />
                    </div>
                  </div>

                  {detailCols.length > 0 && (
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
                      {detailCols.map((c) => (
                        <div key={c.key} className="min-w-0">
                          <dt className="text-[11px] uppercase tracking-wide text-muted">{c.label}</dt>
                          <dd className="mt-0.5 truncate">
                            {c.render ? c.render(row) : String(row[c.key] ?? "-")}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {controlCols.length > 0 && (
                    <div className="mt-4 space-y-2.5 border-t border-line pt-4">
                      {controlCols.map((c) => (
                        <div key={c.key} className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-muted">{c.label}</span>
                          {c.segmented ? (
                            <SegmentedToggle
                              size="sm"
                              value={!!row[c.key]}
                              onChange={(v) => toggleField(row, c.key, v)}
                              onLabel={c.onLabel}
                              offLabel={c.offLabel}
                            />
                          ) : c.selectOptions ? (
                            <select
                              className="rounded-xl border border-line bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/25"
                              value={String(row[c.key] ?? "")}
                              onChange={(e) => updateField(row, c.key, e.target.value, row[c.key])}
                            >
                              {c.selectOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          ) : (
                            <Switch checked={!!row[c.key]} onChange={(v) => toggleField(row, c.key, v)} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Only as wide as it must be: with the wider page shell most
                tables now fit without a sideways scroll at all. */}
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-soft/60 text-[11px] uppercase tracking-wide text-muted">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-brand"
                      checked={allChecked}
                      onChange={toggleSelectAll}
                      aria-label="Select all rows on this page"
                    />
                  </th>
                  {cfg.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const id = idOf(row);
                  const checked = selected.has(id);
                  return (
                    <tr
                      key={id}
                      className={
                        "border-b border-line/60 last:border-0 transition-colors " +
                        (checked ? "bg-mint/40" : "hover:bg-soft/70")
                      }
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-brand"
                          checked={checked}
                          onChange={() => toggleOne(id)}
                        />
                      </td>
                      {cfg.columns.map((c) => (
                        <td key={c.key} className="px-4 py-3 align-middle">
                          {c.segmented ? (
                            <SegmentedToggle
                              size="sm"
                              value={!!row[c.key]}
                              onChange={(v) => toggleField(row, c.key, v)}
                              onLabel={c.onLabel}
                              offLabel={c.offLabel}
                            />
                          ) : c.toggle ? (
                            <Switch
                              checked={!!row[c.key]}
                              onChange={(v) => toggleField(row, c.key, v)}
                              title={row[c.key] ? "On - click to switch off" : "Off - click to switch on"}
                            />
                          ) : c.selectOptions ? (
                            <select
                              className="rounded-xl border border-line bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none transition focus:border-brand"
                              value={String(row[c.key] ?? "")}
                              onChange={(e) =>
                                updateField(row, c.key, e.target.value, row[c.key])
                              }
                            >
                              {c.selectOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          ) : c.render ? (
                            c.render(row)
                          ) : (
                            String(row[c.key] ?? " - ")
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            icon="edit"
                            title="Edit"
                            href={`/panel/${cfg.name}/${encodeURIComponent(id)}`}
                          />
                          <IconButton icon="trash" title="Delete" tone="danger" onClick={() => remove(row)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - only once there is more than one page to move between. */}
        {!loading && !error && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
            <span className="text-xs text-muted" aria-live="polite">
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of{" "}
              {filtered.length}
            </span>
            {pageCount > 1 && (
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
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
                  className="inline-flex h-9 items-center gap-1 rounded-xl border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {someChecked && (
        <p className="mt-3 text-center text-xs text-muted">
          Tip: use the checkboxes to select multiple {cfg.title.toLowerCase()} and act on them at once.
        </p>
      )}
      <div className="h-6" />
    </div>
  );
}
