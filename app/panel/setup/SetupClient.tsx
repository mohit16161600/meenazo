"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, apiPost, type ApiError } from "@/app/panel/_lib/api";

interface Report {
  createdDatabase: boolean;
  tables: string[];
  seeded: Record<string, number>;
  adminCreated: boolean;
  adminEmail: string;
  adminPassword?: string;
}

/**
 * Installer UI. Only ever rendered for a signed-in administrator (the server
 * component in page.tsx enforces that), and the API re-checks the role on every
 * call — this component does no gating of its own.
 *
 * Deliberately says nothing about hosts, users, database names or env files.
 * Connection problems are the server's business; a failure here just says the
 * step failed and points at the logs.
 */
export function SetupClient() {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    apiGet<{ installed: boolean }>("/setup")
      .then((r) => setInstalled(r.installed))
      .catch(() => setInstalled(false));
  }, []);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPost<{ report: Report }>("/setup");
      setReport(res.report);
      setInstalled(true);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-light to-brand text-lg font-black text-[#18231d]">
          M
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink">Panel setup</h1>
        <p className="text-sm text-muted">
          Create any missing tables and seed them with your current site content.
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-6 shadow-brand">
        <div className="mb-4 rounded-xl bg-soft p-4 text-sm text-muted">
          <p className="font-semibold text-ink">What this does:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Creates any table or column the app expects but the database is missing.</li>
            <li>Seeds content tables that are still empty.</li>
            <li>Safe &amp; idempotent — nothing existing is overwritten.</li>
          </ul>
        </div>

        {installed !== null && (
          <p className="mb-4 text-sm">
            Status:{" "}
            {installed ? (
              <span className="font-semibold text-brand">✓ Installed</span>
            ) : (
              <span className="font-semibold text-amber-600">Not installed yet</span>
            )}
          </p>
        )}

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <Button onClick={run} loading={busy} className="w-full">
          {installed ? "Re-run setup / re-seed" : "Install & seed database"}
        </Button>
      </div>

      {report && (
        <div className="mt-6 rounded-xl border border-line bg-white p-6 shadow-brand">
          <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
              <Icon name="check" size={14} strokeWidth={2.5} />
            </span>
            Setup complete
          </h2>
          <ul className="space-y-1 text-sm text-ink">
            <li>Database created: {report.createdDatabase ? "yes (new)" : "already existed"}</li>
            <li>Tables ready: {report.tables.length}</li>
            <li>
              Seeded:{" "}
              {Object.entries(report.seeded)
                .filter(([, n]) => n > 0)
                .map(([k, n]) => `${k} (${n})`)
                .join(", ") || "already had data"}
            </li>
          </ul>

          {report.adminCreated && report.adminPassword && (
            <div className="mt-4 rounded-xl border border-brand/30 bg-mint p-4 text-sm">
              <p className="font-bold text-brand-dark">Save these now — shown once</p>
              <p className="mt-1 text-ink">
                Email: <b>{report.adminEmail}</b>
                <br />
                Password: <b>{report.adminPassword}</b>
              </p>
              <p className="mt-2 text-xs text-brand-dark">
                Change this password after first login (Admin users).
              </p>
            </div>
          )}

          <Link href="/panel/dashboard">
            <Button className="mt-5 w-full">Go to dashboard →</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
