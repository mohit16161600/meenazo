"use client";

import { useEffect } from "react";

import { cn } from "@/utils/cn";
import type { Address } from "@/types";
import { Icon } from "@/components/ui/Icon";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";

/** The editable subset of an Address used on the checkout form. */
export type AddressFormValue = Omit<Address, "id" | "isDefault">;

/** Sensible empty defaults for a fresh shipping/billing address. */
export const emptyAddress: AddressFormValue = {
  fullName: "",
  phone: "",
  pincode: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  country: "India",
  type: "home",
};

const ADDRESS_TYPES: { value: Address["type"]; label: string; icon: string }[] = [
  { value: "home", label: "Home", icon: "home" },
  { value: "work", label: "Work", icon: "bag" },
  { value: "other", label: "Other", icon: "map-pin" },
];

interface AddressFieldsProps {
  value: AddressFormValue;
  onChange: (next: AddressFormValue) => void;
  /** Prefix applied to input ids/names so two instances stay unique. */
  idPrefix?: string;
  /** When true, marks the required inputs with the `required` attribute. */
  required?: boolean;
  /** Field keys that failed validation — highlights them in red. */
  errors?: Partial<Record<keyof AddressFormValue, boolean>>;
  className?: string;
}

/**
 * Reusable, fully-controlled set of address inputs (full name, phone, pincode,
 * address lines, city, state, country, address type). Used for both the shipping
 * and billing address on the checkout form.
 */
export function AddressFields({
  value,
  onChange,
  idPrefix = "addr",
  required = true,
  errors,
  className,
}: AddressFieldsProps) {
  const set = <K extends keyof AddressFormValue>(key: K, v: AddressFormValue[K]) =>
    onChange({ ...value, [key]: v });

  const id = (k: string) => `${idPrefix}-${k}`;
  const invalid = (k: keyof AddressFormValue) => Boolean(errors?.[k]);
  const fieldClass = (k: keyof AddressFormValue) =>
    cn("field", invalid(k) && "border-red-400 focus:border-red-400");

  /* ---- Pincode → auto-fill state + area options ---- */
  const lookup = usePincodeLookup(value.pincode);
  const areaOptions = lookup.areas;
  const statesKey = lookup.states.join("|");
  const areasKey = areaOptions.map((a) => a.name).join("|");

  // When a pincode resolves: auto-select the sole state, and drop a city that
  // no longer belongs to the new pincode so the area dropdown re-prompts.
  useEffect(() => {
    if (lookup.status !== "success") return;
    const patch: Partial<AddressFormValue> = {};
    if (lookup.states.length === 1 && value.state !== lookup.states[0]) {
      patch.state = lookup.states[0];
    }
    if (value.city && !areaOptions.some((a) => a.name === value.city)) {
      patch.city = "";
    }
    if (Object.keys(patch).length) onChange({ ...value, ...patch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookup.status, statesKey, areasKey]);

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}>
      {/* Full name */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("fullName")}>
          Full name <span className="text-brand">*</span>
        </label>
        <input
          id={id("fullName")}
          name={id("fullName")}
          type="text"
          autoComplete="name"
          className={fieldClass("fullName")}
          placeholder="e.g. Ananya Sharma"
          value={value.fullName}
          required={required}
          aria-invalid={invalid("fullName")}
          onChange={(e) => set("fullName", e.target.value)}
        />
      </div>

      {/* Phone */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("phone")}>
          Phone number <span className="text-brand">*</span>
        </label>
        <input
          id={id("phone")}
          name={id("phone")}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={10}
          className={fieldClass("phone")}
          placeholder="10-digit mobile number"
          value={value.phone}
          required={required}
          aria-invalid={invalid("phone")}
          onChange={(e) => set("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
        />
      </div>

      {/* Address line 1 */}
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id("line1")}>
          Address line 1 <span className="text-brand">*</span>
        </label>
        <input
          id={id("line1")}
          name={id("line1")}
          type="text"
          autoComplete="address-line1"
          className={fieldClass("line1")}
          placeholder="House / flat no., building, street"
          value={value.line1}
          required={required}
          aria-invalid={invalid("line1")}
          onChange={(e) => set("line1", e.target.value)}
        />
      </div>

      {/* Address line 2 (optional) */}
      <div className="sm:col-span-2">
        <label className="label" htmlFor={id("line2")}>
          Address line 2 <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          id={id("line2")}
          name={id("line2")}
          type="text"
          autoComplete="address-line2"
          className="field"
          placeholder="Area, landmark, locality"
          value={value.line2 ?? ""}
          onChange={(e) => set("line2", e.target.value)}
        />
      </div>

      {/* Pincode */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("pincode")}>
          Pincode <span className="text-brand">*</span>
        </label>
        <input
          id={id("pincode")}
          name={id("pincode")}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          className={fieldClass("pincode")}
          placeholder="6-digit PIN"
          value={value.pincode}
          required={required}
          aria-invalid={invalid("pincode")}
          onChange={(e) => set("pincode", e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
        />
        {lookup.status === "loading" && (
          <p className="mt-1 text-xs text-muted">⏳ Fetching location details…</p>
        )}
        {lookup.status === "success" && (
          <p className="mt-1 text-xs text-brand">
            ✅ {areaOptions.length} area{areaOptions.length === 1 ? "" : "s"} found — pick yours below.
          </p>
        )}
        {lookup.status === "empty" && (
          <p className="mt-1 text-xs text-amber-600">
            ⚠️ No area found for this PIN — enter city &amp; state manually.
          </p>
        )}
        {lookup.status === "error" && (
          <p className="mt-1 text-xs text-red-600">
            ❌ Couldn&apos;t fetch location — enter city &amp; state manually.
          </p>
        )}
      </div>

      {/* City / Area — a dropdown of post-office areas once the pincode
          resolves, otherwise a plain text input for manual entry. */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("city")}>
          City / Area <span className="text-brand">*</span>
        </label>
        {areaOptions.length > 0 ? (
          <select
            id={id("city")}
            name={id("city")}
            className={fieldClass("city")}
            value={value.city}
            required={required}
            aria-invalid={invalid("city")}
            onChange={(e) => set("city", e.target.value)}
          >
            <option value="">Select your city / area</option>
            {areaOptions.map((a, i) => (
              <option key={`${a.name}-${i}`} value={a.name}>
                {a.district ? `${a.name} — ${a.district}` : a.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id("city")}
            name={id("city")}
            type="text"
            autoComplete="address-level2"
            className={fieldClass("city")}
            placeholder="City / town"
            value={value.city}
            required={required}
            aria-invalid={invalid("city")}
            onChange={(e) => set("city", e.target.value)}
          />
        )}
      </div>

      {/* State */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("state")}>
          State <span className="text-brand">*</span>
        </label>
        <input
          id={id("state")}
          name={id("state")}
          type="text"
          autoComplete="address-level1"
          className={fieldClass("state")}
          placeholder="State"
          value={value.state}
          required={required}
          aria-invalid={invalid("state")}
          onChange={(e) => set("state", e.target.value)}
        />
      </div>

      {/* Country */}
      <div className="sm:col-span-1">
        <label className="label" htmlFor={id("country")}>
          Country
        </label>
        <input
          id={id("country")}
          name={id("country")}
          type="text"
          autoComplete="country-name"
          className="field"
          value={value.country}
          required={required}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>

      {/* Address type */}
      <div className="sm:col-span-2">
        <span className="label">Save address as</span>
        <div className="flex flex-wrap gap-2">
          {ADDRESS_TYPES.map((t) => {
            const active = value.type === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => set("type", t.value)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "border-brand bg-mint text-brand-dark"
                    : "border-line text-muted hover:border-brand hover:text-brand"
                )}
              >
                <Icon name={t.icon} size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
