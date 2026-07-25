"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  LinkButton,
  LoadingBlock,
  PageHeader,
  Switch,
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

  const idOf = (r: Record<string, unknown>) => String(r[cfg.pkKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ items: Record<string, unknown>[] }>(`/${cfg.name}`);
      setRows(res.items ?? []);
      setSelected(new Set());
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.name]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      q
        ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))
        : rows,
    [rows, q]
  );

  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(idOf(r)));
  const someChecked = selected.size > 0;

  function toggleSelectAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(idOf)));
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
              className="w-64 max-w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
              placeholder={`Search ${cfg.title.toLowerCase()}…`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-soft hover:text-ink"
          >
            <Icon name="refresh" size={15} /> Refresh
          </button>
          <span className="ml-auto text-xs text-muted">{filtered.length} shown</span>
        </div>

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
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={cfg.icon}
            title={q ? "No matches" : `No ${cfg.title.toLowerCase()} yet`}
            hint={q ? "Try a different search." : `Create your first ${cfg.singular.toLowerCase()} to get started.`}
            action={
              !cfg.hideCreate && !q ? (
                <LinkButton href={`/panel/${cfg.name}/new`} icon="plus">
                  New {cfg.singular.toLowerCase()}
                </LinkButton>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-soft/60 text-[11px] uppercase tracking-wide text-muted">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-brand"
                      checked={allChecked}
                      onChange={toggleSelectAll}
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
                {filtered.map((row) => {
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
                          {c.toggle ? (
                            <Switch
                              checked={!!row[c.key]}
                              onChange={(v) => toggleField(row, c.key, v)}
                              title={row[c.key] ? "Active — click to deactivate" : "Inactive — click to activate"}
                            />
                          ) : c.selectOptions ? (
                            <select
                              className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs font-medium text-ink outline-none transition focus:border-brand"
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
                            String(row[c.key] ?? "—")
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
