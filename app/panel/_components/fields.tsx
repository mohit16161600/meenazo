"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import { apiGet } from "../_lib/api";
import type { ImageAsset, ImageRef } from "@/types";
import { fromAsset, toAsset } from "@/utils/image";

/**
 * The editor pulls in ProseMirror, which is heavy and browser-only. Loading it
 * lazily keeps every other panel form (products, orders, coupons…) off that
 * bundle — only a page with a richtext field pays for it.
 */
const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((m) => m.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[380px] animate-pulse rounded-xl border border-line bg-soft/60" />
    ),
  }
);

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "checkbox"
  | "select"
  | "ref"
  | "tags"
  | "stringlist"
  | "objectlist"
  | "color"
  | "gradient"
  | "image"
  | "imagelist"
  | "password"
  | "json";

export interface SubField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox" | "image";
  placeholder?: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  section?: string;
  full?: boolean;
  required?: boolean;
  pk?: boolean; // primary key - read-only when editing
  /** Display-only: shown but never editable (system-managed fields). */
  readOnly?: boolean;
  step?: number;
  options?: { value: string; label: string }[];
  refResource?: string; // for type "ref"
  refValue?: string;
  refLabel?: string;
  subfields?: SubField[]; // for objectlist
  default?: unknown;
}

const inputCls =
  "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-muted/50 disabled:bg-soft disabled:text-muted";

function Label({ spec }: { spec: FieldSpec }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-sm font-semibold text-ink">
      {spec.label}
      {spec.required && <span className="text-red-500">*</span>}
    </label>
  );
}

export function Field({
  spec,
  value,
  onChange,
  editing,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  editing: boolean;
}) {
  const readOnly = (spec.pk && editing) || !!spec.readOnly;

  return (
    <div className={spec.full ? "sm:col-span-2" : ""}>
      {spec.type !== "checkbox" && <Label spec={spec} />}
      <FieldInput spec={spec} value={value} onChange={onChange} readOnly={!!readOnly} />
      {spec.help && <p className="mt-1 text-xs text-muted">{spec.help}</p>}
    </div>
  );
}

function FieldInput({
  spec,
  value,
  onChange,
  readOnly,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  readOnly: boolean;
}) {
  switch (spec.type) {
    // Article bodies get the WYSIWYG toolbar — the content team should never
    // have to hand-write <h2>. It still stores plain HTML, so posts written
    // before the editor existed open and save unchanged.
    case "richtext":
      return readOnly ? (
        <div
          className="max-h-[420px] overflow-auto rounded-xl border border-line bg-soft/60 px-4 py-3 text-sm"
          dangerouslySetInnerHTML={{ __html: String(value ?? "") }}
        />
      ) : (
        <RichTextEditor value={value} onChange={onChange} placeholder={spec.placeholder} />
      );

    case "textarea":
    case "json":
      return (
        <textarea
          className={`${inputCls} font-normal ${spec.type === "json" ? "min-h-[120px] font-mono text-xs" : "min-h-[90px]"}`}
          value={String(value ?? "")}
          placeholder={spec.placeholder}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          step={spec.step ?? 1}
          className={inputCls}
          value={value === null || value === undefined ? "" : String(value)}
          placeholder={spec.placeholder}
          disabled={readOnly}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
        />
      );

    case "checkbox":
      return (
        <label
          className={`flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 ${
            readOnly ? "cursor-not-allowed bg-soft opacity-70" : "cursor-pointer bg-white"
          }`}
        >
          <input
            type="checkbox"
            className="h-4 w-4 accent-brand"
            checked={!!value}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm font-medium text-ink">{spec.label}</span>
        </label>
      );

    case "select":
      return (
        <select
          className={inputCls}
          value={String(value ?? "")}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value=""> - select - </option>
          {spec.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "ref":
      return <RefSelect spec={spec} value={value} onChange={onChange} />;

    case "password":
      return <PasswordInput spec={spec} value={value} onChange={onChange} readOnly={readOnly} />;

    case "color":
      return <ColorInput value={value} onChange={onChange} placeholder={spec.placeholder} />;

    case "gradient":
      return <GradientInput value={value} onChange={onChange} />;

    case "image":
      return <ImageInput value={value} onChange={onChange} placeholder={spec.placeholder} />;

    case "imagelist":
      return <ImageListInput value={value} onChange={onChange} />;

    case "tags":
      return <TagsInput value={value} onChange={onChange} placeholder={spec.placeholder} />;

    case "stringlist":
      return <StringListInput value={value} onChange={onChange} placeholder={spec.placeholder} />;

    case "objectlist":
      return <ObjectListInput spec={spec} value={value} onChange={onChange} />;

    case "text":
    default:
      return (
        <input
          type="text"
          className={inputCls}
          value={String(value ?? "")}
          placeholder={spec.placeholder}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

/* ------------------------------- Password -------------------------------- */
/**
 * Password field with a Show/Hide toggle.
 *
 * This panel deliberately stores the plaintext password so the owner can read
 * and share it - masking it behind dots with no way to reveal it defeats that
 * whole purpose. The toggle is also the standard cure for typing blind.
 */
function PasswordInput({
  spec,
  value,
  onChange,
  readOnly,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
  readOnly: boolean;
}) {
  const [show, setShow] = useState(false);
  const text = String(value ?? "");
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        className={`${inputCls} pr-20`}
        value={text}
        placeholder={spec.placeholder}
        autoComplete="new-password"
        disabled={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-pressed={show}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted transition-colors hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

/* ------------------------------- Ref select ------------------------------ */
function RefSelect({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let alive = true;
    apiGet<{ items: Record<string, unknown>[] }>(`/${spec.refResource}?limit=300`)
      .then((res) => {
        if (!alive) return;
        setOptions(
          (res.items ?? []).map((it) => ({
            value: String(it[spec.refValue ?? "slug"] ?? ""),
            label: String(it[spec.refLabel ?? "name"] ?? it[spec.refValue ?? "slug"] ?? ""),
          }))
        );
      })
      .catch(() => setOptions([]));
    return () => {
      alive = false;
    };
  }, [spec.refResource, spec.refValue, spec.refLabel]);

  return (
    <select
      className={inputCls}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value=""> - select - </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label} ({o.value})
        </option>
      ))}
    </select>
  );
}

/* ------------------------------- Color ------------------------------ */
function ColorInput({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
}) {
  const v = String(value ?? "");
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        className="h-10 w-12 cursor-pointer rounded-xl border border-line bg-white"
        value={isHex ? v : "#5b8c6e"}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        type="text"
        className={inputCls}
        value={v}
        placeholder={placeholder ?? "#5b8c6e"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ------------------------------ Gradient ---------------------------- */
function GradientInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const arr = Array.isArray(value) ? (value as string[]) : ["#eaf3ee", "#dceee4"];
  const [a, b] = [arr[0] ?? "#eaf3ee", arr[1] ?? "#dceee4"];
  const set = (i: number, val: string) => {
    const next = [a, b];
    next[i] = val;
    onChange(next);
  };
  const hex = (s: string) => (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s) ? s : "#eaf3ee");
  return (
    <div className="space-y-2">
      <div
        className="h-8 w-full rounded-xl border border-line"
        style={{ background: `linear-gradient(120deg, ${a}, ${b})` }}
      />
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-10 cursor-pointer rounded-xl border border-line"
              value={hex(i === 0 ? a : b)}
              onChange={(e) => set(i, e.target.value)}
            />
            <input
              type="text"
              className={inputCls}
              value={i === 0 ? a : b}
              onChange={(e) => set(i, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------- Image ------------------------------ */
const UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

/**
 * Image field: upload a file from the computer, or paste a URL.
 *
 * Both paths store the same thing - a path the browser can load - so nothing
 * downstream (the live site, the published snapshot) has to care which was
 * used. The upload posts to /api/panel/upload, which writes the file into
 * public/images/uploads and returns its public path.
 */
function ImageInput({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
}) {
  const asset = toAsset(value as ImageRef | null | undefined);
  const v = asset.src;
  const emit = (next: Partial<ImageAsset>) => onChange(fromAsset({ ...asset, ...next }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/panel/upload", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.message ?? `Upload failed (${res.status}).`);
        return;
      }
      emit({ src: data.url });
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files);
        }}
        className={`flex items-start gap-3 rounded-xl border border-dashed p-2 transition ${
          dragging ? "border-brand bg-brand/5" : "border-transparent"
        }`}
      >
        {v ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl border border-line bg-white object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-line text-muted">
            🖼️
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="text"
            className={inputCls}
            value={v}
            placeholder={placeholder ?? "Upload a file, or paste /images/… or https://…"}
            onChange={(e) => emit({ src: e.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={inputId}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                pick(e.target.files);
                e.target.value = ""; // let the same file be re-picked after an error
              }}
            />
            <label
              htmlFor={inputId}
              className={`inline-flex min-h-[36px] cursor-pointer items-center rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-soft focus-within:ring-2 focus-within:ring-brand/20 ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {busy ? "Uploading…" : "⬆ Upload image"}
            </label>
            {v && !busy && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setError(null);
                }}
                className="inline-flex min-h-[36px] items-center rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted transition hover:text-red-600 focus-visible:ring-2 focus-visible:ring-brand/20"
              >
                Remove
              </button>
            )}
            <span className="text-xs text-muted">
              or drag a file here · JPG, PNG, WebP, GIF, AVIF · up to 5 MB
            </span>
          </div>

          {/* Alt text sits with the picture, not the page that shows it — the
              same file should describe itself the same way everywhere. Only
              shown once there IS an image; asking for alt on an empty slot is
              noise. */}
          {v && (
            <div className="space-y-2 rounded-xl border border-line bg-soft/50 p-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
                  Alt text
                  {!asset.alt?.trim() && (
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      missing
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={asset.alt ?? ""}
                  placeholder="Describe the image for screen readers and Google"
                  onChange={(e) => emit({ alt: e.target.value })}
                />
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Say what the image shows, not that it is an image. Leave blank only when it is
                  purely decorative.
                </p>
              </div>
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-muted hover:text-ink">
                  Title &amp; caption (optional)
                </summary>
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={asset.title ?? ""}
                    placeholder="Title — tooltip on hover"
                    onChange={(e) => emit({ title: e.target.value })}
                  />
                  <input
                    type="text"
                    className={inputCls}
                    value={asset.caption ?? ""}
                    placeholder="Caption — shown under the image"
                    onChange={(e) => emit({ caption: e.target.value })}
                  />
                </div>
              </details>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------- Tags ------------------------------ */
function TagsInput({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
}) {
  const tags = Array.isArray(value) ? (value as string[]) : [];
  const [draft, setDraft] = useState("");
  const add = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft("");
  };
  return (
    <div className="rounded-xl border border-line bg-white p-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t, i) => (
          <span
            key={`${t}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-medium text-brand-dark"
          >
            {t}
            <button
              type="button"
              className="text-brand-dark/60 hover:text-red-600"
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          className="min-w-[120px] flex-1 bg-transparent px-1 py-1 text-sm outline-none"
          value={draft}
          placeholder={placeholder ?? "Type and press Enter"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
        />
      </div>
    </div>
  );
}

/* ----------------------------- String list --------------------------- */
function StringListInput({
  value,
  onChange,
  placeholder,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  placeholder?: string;
}) {
  const list = Array.isArray(value) ? (value as string[]) : [];
  const set = (i: number, val: string) => {
    const next = [...list];
    next[i] = val;
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {list.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className={inputCls}
            value={item}
            placeholder={placeholder}
            onChange={(e) => set(i, e.target.value)}
          />
          <button
            type="button"
            className="shrink-0 rounded-xl border border-line px-3 py-2 text-muted hover:bg-soft hover:text-red-600"
            onClick={() => onChange(list.filter((_, idx) => idx !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        className="rounded-xl border border-dashed border-line px-3 py-1.5 text-sm font-medium text-brand hover:bg-mint"
        onClick={() => onChange([...list, ""])}
      >
        + Add
      </button>
    </div>
  );
}

/* ----------------------------- Object list --------------------------- */
function ObjectListInput({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const list = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const subs = spec.subfields ?? [];

  const setRow = (i: number, key: string, val: unknown) => {
    const next = list.map((row, idx) => (idx === i ? { ...row, [key]: val } : row));
    onChange(next);
  };
  const addRow = () => {
    const blank: Record<string, unknown> = {};
    subs.forEach((s) => (blank[s.key] = s.type === "checkbox" ? false : ""));
    onChange([...list, blank]);
  };

  return (
    <div className="space-y-3">
      {list.map((row, i) => (
        <div key={i} className="rounded-xl border border-line bg-soft/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              #{i + 1}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-muted hover:text-red-600"
              onClick={() => onChange(list.filter((_, idx) => idx !== i))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {subs.map((s) => (
              <div
                key={s.key}
                className={s.type === "textarea" || s.type === "image" ? "sm:col-span-2" : ""}
              >
                <span className="mb-1 block text-xs font-medium text-muted">{s.label}</span>
                {s.type === "textarea" ? (
                  <textarea
                    className={`${inputCls} min-h-[64px]`}
                    value={String(row[s.key] ?? "")}
                    placeholder={s.placeholder}
                    onChange={(e) => setRow(i, s.key, e.target.value)}
                  />
                ) : s.type === "image" ? (
                  <ImageInput
                    value={row[s.key]}
                    onChange={(v) => setRow(i, s.key, v)}
                    placeholder={s.placeholder}
                  />
                ) : s.type === "checkbox" ? (
                  <label className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand"
                      checked={!!row[s.key]}
                      onChange={(e) => setRow(i, s.key, e.target.checked)}
                    />
                    <span className="text-sm text-ink">Yes</span>
                  </label>
                ) : (
                  <input
                    type={s.type === "number" ? "number" : "text"}
                    className={inputCls}
                    value={row[s.key] === null || row[s.key] === undefined ? "" : String(row[s.key])}
                    placeholder={s.placeholder}
                    onChange={(e) =>
                      setRow(
                        i,
                        s.key,
                        s.type === "number"
                          ? e.target.value === ""
                            ? null
                            : Number(e.target.value)
                          : e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="rounded-xl border border-dashed border-line px-3 py-1.5 text-sm font-medium text-brand hover:bg-mint"
        onClick={addRow}
      >
        + Add item
      </button>
    </div>
  );
}

/* ------------------------------ Image list ------------------------------- */
/**
 * An ordered list of images, each with its own alt text.
 *
 * Product galleries were a plain list of URLs, which left every photo after the
 * first with nothing to announce. Reordering matters too — the first entry is
 * the one used as the card thumbnail and the social share image — so the list
 * carries move controls rather than asking the editor to retype paths.
 *
 * Values stay backward compatible: an entry with only a path is written back as
 * a plain string, exactly as it was stored before.
 */
function ImageListInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const list: ImageRef[] = Array.isArray(value) ? (value as ImageRef[]) : [];

  const replace = (i: number, next: ImageRef | "") => {
    const copy = [...list];
    if (next === "") copy.splice(i, 1);
    else copy[i] = next;
    onChange(copy);
  };

  const move = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  const missingAlt = list.filter((r) => !toAsset(r).alt?.trim()).length;

  return (
    <div className="space-y-3">
      {list.map((ref, i) => (
        <div key={i} className="rounded-xl border border-line bg-soft/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {i === 0 ? "Main photo" : `Photo ${i + 1}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-white hover:text-ink disabled:opacity-30"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-white hover:text-ink disabled:opacity-30"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => replace(i, "")}
                className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition hover:text-red-600"
              >
                Remove
              </button>
            </div>
          </div>
          <ImageInput value={ref} onChange={(v) => replace(i, v as ImageRef | "")} />
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onChange([...list, ""])}
          className="rounded-xl border border-dashed border-line px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-mint"
        >
          + Add photo
        </button>
        {missingAlt > 0 && (
          <span className="text-xs font-medium text-amber-700">
            {missingAlt} photo{missingAlt === 1 ? "" : "s"} still need alt text
          </span>
        )}
      </div>
    </div>
  );
}
