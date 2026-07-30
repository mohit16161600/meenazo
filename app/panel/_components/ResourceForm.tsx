"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field, type FieldSpec } from "./fields";
import { Button, Card, LinkButton, LoadingBlock, PageHeader } from "./ui";
import { useToast } from "./toast";
import { getResource } from "../_lib/specs";
import { apiGet, apiPost, apiPut, type ApiError } from "../_lib/api";

function defaultValue(spec: FieldSpec): unknown {
  if (spec.default !== undefined) return spec.default;
  switch (spec.type) {
    case "number":
      return null;
    case "checkbox":
      return false;
    case "tags":
    case "stringlist":
    case "objectlist":
      return [];
    case "gradient":
      return ["#eaf3ee", "#dceee4"];
    default:
      return "";
  }
}

export function ResourceForm({
  resourceName,
  id,
}: {
  resourceName: string;
  id: string;
}) {
  const cfg = getResource(resourceName)!;
  const router = useRouter();
  const toast = useToast();
  const editing = id !== "new";

  const initial = useMemo(() => {
    const obj: Record<string, unknown> = {};
    cfg.fields.forEach((f) => (obj[f.key] = defaultValue(f)));
    return obj;
  }, [cfg]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let alive = true;
    apiGet<{ item: Record<string, unknown> }>(`/${cfg.name}/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!alive) return;
        const merged = { ...initial };
        for (const f of cfg.fields) {
          const v = res.item[f.key];
          if (v !== undefined && v !== null) merged[f.key] = v;
        }
        setValues(merged);
      })
      .catch((e: ApiError) => toast.push("error", e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id, cfg]);

  const sections = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, FieldSpec[]> = {};
    for (const f of cfg.fields) {
      const s = f.section ?? "Details";
      if (!map[s]) {
        map[s] = [];
        order.push(s);
      }
      map[s].push(f);
    }
    return order.map((s) => ({ title: s, fields: map[s] }));
  }, [cfg]);

  const set = (key: string, v: unknown) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  async function submit() {
    // basic required validation
    for (const f of cfg.fields) {
      if (!f.required) continue;
      const v = values[f.key];
      if (v === "" || v === null || v === undefined) {
        toast.push("error", `${f.label} is required.`);
        return;
      }
    }

    const payload: Record<string, unknown> = {};
    for (const f of cfg.fields) {
      if (editing && f.pk) continue; // don't resend the primary key on update
      if (f.readOnly) continue; // display-only fields are never written back
      payload[f.key] = values[f.key];
    }

    setSaving(true);
    try {
      if (editing) {
        await apiPut(`/${cfg.name}/${encodeURIComponent(id)}`, payload);
        toast.push("success", `${cfg.singular} updated.`);
      } else {
        await apiPost(`/${cfg.name}`, payload);
        toast.push("success", `${cfg.singular} created.`);
      }
      router.push(`/panel/${cfg.name}`);
      router.refresh();
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label={`Loading ${cfg.singular.toLowerCase()}…`} />;

  return (
    <div>
      <PageHeader
        title={editing ? `Edit ${cfg.singular.toLowerCase()}` : `New ${cfg.singular.toLowerCase()}`}
        subtitle={editing ? String(id) : `Add a new ${cfg.singular.toLowerCase()} to ${cfg.title.toLowerCase()}`}
        actions={
          <>
            <LinkButton href={`/panel/${cfg.name}`} variant="ghost">
              Cancel
            </LinkButton>
            <Button onClick={submit} loading={saving}>
              {editing ? "Save changes" : `Create ${cfg.singular.toLowerCase()}`}
            </Button>
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="space-y-5"
      >
        {sections.map((sec) => (
          <Card key={sec.title} className="p-5">
            <h2 className="mb-4 border-b border-line pb-3 text-sm font-bold uppercase tracking-wide text-brand">
              {sec.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {sec.fields.map((f) => (
                <Field
                  key={f.key}
                  spec={f}
                  value={values[f.key]}
                  onChange={(v) => set(f.key, v)}
                  editing={editing}
                />
              ))}
            </div>
          </Card>
        ))}

        <div className="sticky bottom-0 z-10 -mx-4 flex justify-end gap-2 border-t border-line bg-white/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <LinkButton href={`/panel/${cfg.name}`} variant="outline">
            Cancel
          </LinkButton>
          <Button type="submit" loading={saving} icon={editing ? "check" : "plus"}>
            {editing ? "Save changes" : `Create ${cfg.singular.toLowerCase()}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
