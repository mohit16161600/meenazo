"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, LoadingBlock, PageHeader } from "@/app/panel/_components/ui";
import { Icon } from "@/app/panel/_components/Icon";
import { apiGet, type ApiError } from "@/app/panel/_lib/api";
import { cn } from "@/utils/cn";

type CheckStatus = "ok" | "warn" | "error";
interface Check {
  label: string;
  status: CheckStatus;
  message: string;
}
interface SystemData {
  checkedAt: string;
  errors: number;
  warnings: number;
  groups: { title: string; checks: Check[] }[];
}

const DOT: Record<CheckStatus, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
};
const TONE: Record<CheckStatus, "green" | "amber" | "red"> = {
  ok: "green",
  warn: "amber",
  error: "red",
};
const TEXT: Record<CheckStatus, string> = {
  ok: "OK",
  warn: "Warning",
  error: "Issue",
};

export default function SystemStatusPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const d = await apiGet<SystemData & { success: boolean }>("/system");
      setData(d);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error)
    return (
      <Card className="p-6">
        <p className="text-red-600">Could not load system status: {error}</p>
      </Card>
    );
  if (!data) return <LoadingBlock label="Checking all systems…" />;

  const healthy = data.errors === 0 && data.warnings === 0;

  return (
    <div>
      <PageHeader
        title="System status"
        subtitle="Live health of every integration - database, EasyEcom, OTP, payments & secrets"
        actions={
          <Button variant="outline" icon="refresh" onClick={load} loading={refreshing}>
            Re-check now
          </Button>
        }
      />

      {/* Summary banner */}
      <Card
        className={cn(
          "mb-6 flex items-center gap-3 border p-4",
          data.errors > 0
            ? "border-red-200 bg-red-50/60"
            : data.warnings > 0
              ? "border-amber-200 bg-amber-50/60"
              : "border-emerald-200 bg-emerald-50/60"
        )}
      >
        <span
          className={cn(
            "grid h-10 w-10 flex-none place-items-center rounded-xl text-white",
            data.errors > 0 ? "bg-red-500" : data.warnings > 0 ? "bg-amber-500" : "bg-emerald-500"
          )}
        >
          <Icon name={healthy ? "check" : "alert"} size={20} />
        </span>
        <div>
          <p className="font-bold text-ink">
            {data.errors > 0
              ? `${data.errors} issue${data.errors === 1 ? "" : "s"} need attention`
              : data.warnings > 0
                ? `Working, with ${data.warnings} warning${data.warnings === 1 ? "" : "s"}`
                : "All systems normal"}
          </p>
          <p className="text-xs text-muted">
            {data.warnings > 0 && data.errors > 0 && `Plus ${data.warnings} warning${data.warnings === 1 ? "" : "s"}. `}
            Checked {new Date(data.checkedAt).toLocaleString("en-IN")}
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.groups.map((g) => {
          const worst: CheckStatus = g.checks.some((c) => c.status === "error")
            ? "error"
            : g.checks.some((c) => c.status === "warn")
              ? "warn"
              : "ok";
          return (
            <Card key={g.title} className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-ink">{g.title}</h2>
                <Badge tone={TONE[worst]}>{TEXT[worst]}</Badge>
              </div>
              <ul className="space-y-3.5">
                {g.checks.map((c, i) => (
                  <li key={`${c.label}-${i}`} className="flex gap-3">
                    <span
                      className={cn("mt-1.5 h-2.5 w-2.5 flex-none rounded-full", DOT[c.status])}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">{c.label}</p>
                      <p
                        className={cn(
                          "mt-0.5 break-words text-xs leading-relaxed",
                          c.status === "error"
                            ? "font-medium text-red-600"
                            : c.status === "warn"
                              ? "text-amber-700"
                              : "text-muted"
                        )}
                      >
                        {c.message}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
