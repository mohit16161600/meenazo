"use client";

import { useEffect, useMemo, useState } from "react";
import { Field, type FieldSpec } from "@/app/panel/_components/fields";
import { Button, Card, LoadingBlock, PageHeader } from "@/app/panel/_components/ui";
import { useToast } from "@/app/panel/_components/toast";
import { apiGet, apiPut, type ApiError } from "@/app/panel/_lib/api";

const FIELDS: FieldSpec[] = [
  { key: "name", label: "Brand name", type: "text", required: true, section: "Brand" },
  { key: "logoEmoji", label: "Logo emoji", type: "text", section: "Brand" },
  {
    key: "logoImage",
    label: "Logo",
    type: "image",
    full: true,
    section: "Brand",
    help: "Shown in the header, footer and mobile menu. Leave empty to fall back to the leaf mark + brand name.",
  },
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
  {
    key: "prepaidDiscountPercent",
    label: "Prepaid discount (%)",
    type: "number",
    section: "Commerce",
    help: "Instant discount for paying online instead of COD. 0 switches the whole offer off - the badge, the savings line and the amount charged. Applied after any coupon.",
  },
  {
    key: "prepaidDiscountMax",
    label: "Max prepaid discount (₹)",
    type: "number",
    section: "Commerce",
    help: "Cap on the prepaid discount. 0 = no cap.",
  },
  {
    key: "codMaxOrderValue",
    label: "COD available up to (₹)",
    type: "number",
    section: "Commerce",
    help: "Orders above this total can only be paid online - the COD option is greyed out at checkout and refused by the server. 0 = no limit.",
  },
  {
    key: "codCooldownMinutes",
    label: "Gap between COD orders (minutes)",
    type: "number",
    section: "Commerce",
    help: "One mobile number can place only one COD order in this many minutes; until then that customer must pay online or wait. 0 = no limit.",
  },

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

/** The two master switches, in the order they appear on the card. */
const PAYMENT_SWITCHES: {
  key: "onlinePaymentEnabled" | "codEnabled";
  icon: string;
  title: string;
  subtitle: string;
}[] = [
  {
    key: "onlinePaymentEnabled",
    icon: "💳",
    title: "Online Payment (Prepaid)",
    subtitle:
      "UPI, cards, netbanking & wallets via Razorpay. Turning this OFF greys the option out at checkout, removes the prepaid discount everywhere and makes the server refuse online orders — a COD-only shop.",
  },
  {
    key: "codEnabled",
    icon: "💵",
    title: "Cash on Delivery (COD)",
    subtitle:
      "Pay-on-delivery orders. Turning this OFF greys the option out at checkout and makes the server refuse COD orders — a prepaid-only shop.",
  },
];

/**
 * A master on/off switch for one payment method.
 * ---------------------------------------------------------------------------
 * It SAVES THE MOMENT IT IS FLIPPED — no "Save settings" step. The whole point
 * of this control is that the owner can stop taking COD (or prepaid) in one
 * click when something goes wrong, and the checkout must follow immediately.
 */
function PaymentSwitch({
  icon,
  title,
  subtitle,
  on,
  busy,
  onToggle,
}: {
  icon: string;
  title: string;
  subtitle: string;
  on: boolean;
  busy: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-xl border p-4 transition-colors ${
        on ? "border-brand/30 bg-white" : "border-line bg-soft"
      }`}
    >
      <span
        className={`grid h-11 w-11 flex-none place-items-center rounded-xl text-xl ring-1 ${
          on ? "bg-mint ring-brand/25" : "bg-white ring-line opacity-60"
        }`}
        aria-hidden
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-ink">{title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
              on ? "bg-mint text-brand-dark" : "bg-amber-100 text-amber-800"
            }`}
          >
            {on ? "On" : "Off"}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${title} — ${on ? "on" : "off"}`}
        disabled={busy}
        onClick={() => onToggle(!on)}
        className={`relative mt-1 h-7 w-12 flex-none rounded-full transition-colors disabled:opacity-50 ${
          on ? "bg-brand" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            on ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  /** Which switch is mid-save (null = none) — keeps double-clicks out. */
  const [switching, setSwitching] = useState<string | null>(null);

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

  /**
   * Flip one payment method on/off and persist it right away.
   * Optimistic: the switch moves first and is put back if the save fails, so a
   * failed request can never leave the panel claiming COD is off while the shop
   * still takes COD orders.
   */
  async function togglePayment(key: "codEnabled" | "onlinePaymentEnabled", next: boolean) {
    if (!values || switching) return;
    const other = key === "codEnabled" ? "onlinePaymentEnabled" : "codEnabled";

    // Both off is a shop that cannot take a single order. Refused here, where
    // the owner can see why — not left for customers to discover at checkout.
    if (!next && values[other] === false) {
      toast.push(
        "error",
        "At least one payment method must stay ON — with both off, customers have no way to place an order."
      );
      return;
    }

    const previous = values[key];
    const merged = { ...values, [key]: next };
    setValues(merged);
    setSwitching(key);
    try {
      await apiPut("/settings", merged);
      const label = key === "codEnabled" ? "Cash on Delivery" : "Online payment";
      toast.push("success", `${label} is now ${next ? "ON" : "OFF"} for all customers.`);
    } catch (e) {
      setValues((p) => ({ ...(p as object), [key]: previous }));
      toast.push("error", (e as ApiError).message ?? "Could not save. Please try again.");
    } finally {
      setSwitching(null);
    }
  }

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
        {/* ---- Payment options: the two master switches ----
            Deliberately NOT part of the form below: these save on the flip, so
            "turn COD off" is one click and takes effect on the live checkout
            immediately (it is read from the DB on every price quote). */}
        <Card className="p-5">
          <h2 className="mb-1 border-b border-line pb-3 text-sm font-bold uppercase tracking-wide text-brand">
            Payment options
          </h2>
          <p className="mb-4 mt-3 text-xs text-muted">
            Switch a payment method off to stop accepting it on the website. Saved and live
            instantly — no Publish needed. (Product-page prepaid badges still follow the last
            Publish.)
          </p>
          <div className="grid gap-3">
            {PAYMENT_SWITCHES.map((s) => (
              <PaymentSwitch
                key={s.key}
                icon={s.icon}
                title={s.title}
                subtitle={s.subtitle}
                // Missing means ON — a config saved before these switches existed
                // must not read as "payments are off".
                on={values[s.key] !== false}
                busy={switching === s.key}
                onToggle={(next) => void togglePayment(s.key, next)}
              />
            ))}
          </div>
        </Card>

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
