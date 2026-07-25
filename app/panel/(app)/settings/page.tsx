"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, type FieldSpec } from "@/app/panel/_components/fields";
import { Button, Card, LoadingBlock, PageHeader } from "@/app/panel/_components/ui";
import { useToast } from "@/app/panel/_components/toast";
import { apiGet, apiPut, type ApiError } from "@/app/panel/_lib/api";

const FIELDS: FieldSpec[] = [
  { key: "name", label: "Brand name", type: "text", required: true, section: "Brand" },
  { key: "logoEmoji", label: "Logo emoji", type: "text", section: "Brand" },
  { key: "tagline", label: "Tagline", type: "text", full: true, section: "Brand" },
  { key: "description", label: "Description", type: "textarea", full: true, section: "Brand" },

  { key: "email", label: "Email", type: "text", section: "Contact" },
  { key: "phone", label: "Phone", type: "text", section: "Contact" },
  { key: "whatsapp", label: "WhatsApp number", type: "text", section: "Contact" },
  { key: "address", label: "Address", type: "textarea", full: true, section: "Contact" },
  { key: "gst", label: "GST", type: "text", section: "Contact" },
  { key: "pan", label: "PAN", type: "text", section: "Contact" },

  { key: "currency", label: "Currency code", type: "text", section: "Commerce" },
  { key: "currencySymbol", label: "Currency symbol", type: "text", section: "Commerce" },
  { key: "freeShippingThreshold", label: "Free shipping over (₹)", type: "number", section: "Commerce" },
  { key: "shippingCharge", label: "Shipping charge (₹)", type: "number", section: "Commerce" },

  { key: "announcements", label: "Announcement bar messages", type: "stringlist", full: true, section: "Announcements" },

  {
    key: "social",
    label: "Social links",
    type: "objectlist",
    full: true,
    section: "Social links",
    subfields: [
      { key: "label", label: "Label", type: "text" },
      { key: "href", label: "URL", type: "text" },
      { key: "icon", label: "Icon (emoji)", type: "text" },
    ],
  },
  {
    key: "paymentMethods",
    label: "Payment methods",
    type: "objectlist",
    full: true,
    section: "Payment methods",
    subfields: [
      { key: "label", label: "Label", type: "text" },
      { key: "icon", label: "Icon (emoji)", type: "text" },
    ],
  },
];

export default function SettingsPage() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<{ config: Record<string, unknown> }>("/settings")
      .then((res) => setValues(res.config))
      .catch((e: ApiError) => toast.push("error", e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, FieldSpec[]> = {};
    for (const f of FIELDS) {
      const s = f.section ?? "General";
      if (!map[s]) {
        map[s] = [];
        order.push(s);
      }
      map[s].push(f);
    }
    return order.map((s) => ({ title: s, fields: map[s] }));
  }, []);

  if (!values) return <LoadingBlock label="Loading settings…" />;

  const set = (k: string, v: unknown) => setValues((p) => ({ ...(p as object), [k]: v }));

  async function save() {
    setSaving(true);
    try {
      await apiPut("/settings", values);
      toast.push("success", "Settings saved.");
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Site settings"
        subtitle="Brand identity & global store configuration"
        actions={
          <Button onClick={save} loading={saving}>
            Save settings
          </Button>
        }
      />
      <div className="space-y-5">
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
                  editing={false}
                />
              ))}
            </div>
          </Card>
        ))}
        <div className="flex justify-end pb-10">
          <Button onClick={save} loading={saving}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
