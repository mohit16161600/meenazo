"use client";

import { useEffect, useState } from "react";
import { Field, type FieldSpec } from "@/app/panel/_components/fields";
import { Button, Card, LoadingBlock, PageHeader } from "@/app/panel/_components/ui";
import { useToast } from "@/app/panel/_components/toast";
import { apiGet, apiPut, type ApiError } from "@/app/panel/_lib/api";
import type { GlobalSeo } from "@/types";

/**
 * Global SEO — the defaults every page inherits when its own SEO fields are
 * blank, plus the site-wide verification and analytics IDs.
 *
 * Deliberately separate from Site settings: this is the SEO team's screen, and
 * bundling it with pricing, shipping and payment configuration would have meant
 * handing them that too.
 */
const FIELDS: FieldSpec[] = [
  {
    key: "titleSuffix",
    label: "Title suffix",
    type: "text",
    section: "Defaults",
    help: 'Appended as "Page title | Suffix" unless the title already contains it.',
  },
  {
    key: "seoTitle",
    label: "Default meta title",
    type: "text",
    full: true,
    section: "Defaults",
    help: "Used by pages with no title of their own. 30-60 characters.",
  },
  {
    key: "seoDescription",
    label: "Default meta description",
    type: "textarea",
    full: true,
    section: "Defaults",
    help: "120-160 characters.",
  },
  { key: "seoKeywords", label: "Default keywords", type: "tags", full: true, section: "Defaults" },
  {
    key: "robots",
    label: "Default robots",
    type: "select",
    section: "Defaults",
    options: [
      { value: "index, follow", label: "Index & follow (normal)" },
      { value: "noindex, nofollow", label: "Hide the whole site" },
    ],
    help: "Site-wide default. Individual pages can override it.",
  },

  {
    key: "defaultOgImage",
    label: "Default share image",
    type: "image",
    full: true,
    section: "Social",
    help: "1200x630. Used whenever a page has no image of its own — without it, shared links preview as plain text.",
  },
  {
    key: "twitterSite",
    label: "X / Twitter handle",
    type: "text",
    section: "Social",
    placeholder: "@meenazo",
  },

  { key: "googleSiteVerification", label: "Google Search Console", type: "text", full: true, section: "Verification", help: "The content value of the google-site-verification meta tag." },
  { key: "bingSiteVerification", label: "Bing Webmaster", type: "text", full: true, section: "Verification" },
  { key: "facebookDomainVerification", label: "Facebook domain", type: "text", full: true, section: "Verification" },
  { key: "pinterestVerification", label: "Pinterest", type: "text", full: true, section: "Verification" },

  { key: "googleAnalyticsId", label: "Google Analytics (GA4)", type: "text", section: "Analytics", placeholder: "G-XXXXXXXXXX" },
  { key: "googleTagManagerId", label: "Google Tag Manager", type: "text", section: "Analytics", placeholder: "GTM-XXXXXXX" },
  { key: "metaPixelId", label: "Meta Pixel", type: "text", section: "Analytics" },

  {
    key: "robotsTxtExtra",
    label: "Extra robots.txt rules",
    type: "textarea",
    full: true,
    section: "Crawling",
    help: "Appended to the generated robots.txt. One directive per line — the sitemap link and default rules are added automatically.",
  },
];

export default function SeoSettingsPage() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    apiGet<{ seo: GlobalSeo }>("/seo")
      .then((res) => alive && setValues(res.seo as Record<string, unknown>))
      .catch((e: ApiError) => toast.push("error", e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = FIELDS.reduce<Record<string, FieldSpec[]>>((acc, f) => {
    const s = f.section ?? "Defaults";
    (acc[s] ??= []).push(f);
    return acc;
  }, {});

  async function save() {
    setSaving(true);
    try {
      await apiPut("/seo", values);
      toast.push("success", "SEO settings saved.");
    } catch (e) {
      toast.push("error", (e as ApiError).message ?? "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Loading SEO settings…" />;

  return (
    <div>
      <PageHeader
        title="SEO settings"
        subtitle="Site-wide defaults, verification codes and analytics"
        actions={
          <Button onClick={save} loading={saving} icon="check">
            Save changes
          </Button>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-5"
      >
        {Object.entries(sections).map(([title, fields]) => (
          <Card key={title} className="p-5">
            <h2 className="mb-4 border-b border-line pb-3 text-sm font-bold uppercase tracking-wide text-brand">
              {title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((f) => (
                <Field
                  key={f.key}
                  spec={f}
                  value={values[f.key]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                  editing
                />
              ))}
            </div>
          </Card>
        ))}

        <div className="sticky bottom-0 z-10 -mx-4 flex justify-end border-t border-line bg-white/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <Button type="submit" loading={saving} icon="check">
            Save changes
          </Button>
        </div>
      </form>
    </div>
  );
}
