"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { addressService } from "@/services/addressService";
import { cn } from "@/utils/cn";
import type { Address } from "@/types";

type AddressType = Address["type"];

interface FormState {
  id?: string;
  fullName: string;
  phone: string;
  pincode: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  type: AddressType;
  isDefault: boolean;
}

function emptyForm(prefillName = ""): FormState {
  return {
    fullName: prefillName,
    phone: "",
    pincode: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    type: "home",
    isDefault: false,
  };
}

const TYPE_META: Record<AddressType, { label: string; icon: string }> = {
  home: { label: "Home", icon: "home" },
  work: { label: "Work", icon: "settings" },
  other: { label: "Other", icon: "map-pin" },
};

export default function AddressesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm());

  const refresh = () => setAddresses(addressService.list());

  useEffect(() => {
    refresh();
  }, []);

  const openAdd = () => {
    setForm(emptyForm(user?.name ?? ""));
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setForm({
      id: addr.id,
      fullName: addr.fullName,
      phone: addr.phone,
      pincode: addr.pincode,
      line1: addr.line1,
      line2: addr.line2 ?? "",
      city: addr.city,
      state: addr.state,
      country: addr.country,
      type: addr.type,
      isDefault: !!addr.isDefault,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm());
  };

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.pincode.trim() || !form.line1.trim() || !form.city.trim() || !form.state.trim()) {
      error("Missing details", "Please fill in all required fields.");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      error("Invalid pincode", "Please enter a valid 6-digit pincode.");
      return;
    }
    if (!/^[\d\s+-]{7,15}$/.test(form.phone.trim())) {
      error("Invalid phone", "Please enter a valid contact number.");
      return;
    }

    const editing = !!form.id;
    addressService.save({
      id: form.id,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      pincode: form.pincode.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim() || "India",
      type: form.type,
      isDefault: form.isDefault,
    });
    refresh();
    closeForm();
    success(editing ? "Address updated" : "Address saved", "Your address book is up to date.");
  };

  const handleDelete = (id: string) => {
    addressService.remove(id);
    refresh();
    success("Address removed", "The address was deleted from your account.");
  };

  const handleSetDefault = (id: string) => {
    addressService.setDefault(id);
    refresh();
    success("Default updated", "This address will be used by default at checkout.");
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Saved Addresses</h2>
        {!showForm && (
          <Button size="sm" onClick={openAdd}>
            <Icon name="plus" size={16} className="mr-1.5" />
            Add new address
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface p-6 animate-slideUp">
          <h3 className="font-bold text-ink mb-4">
            {form.id ? "Edit address" : "Add a new address"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="addr-name">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-name"
                className="field"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="addr-phone">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-phone"
                className="field"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="addr-pin">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-pin"
                className="field"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                autoComplete="postal-code"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="addr-line1">
                Address line 1 <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-line1"
                className="field"
                placeholder="House no., building, street"
                value={form.line1}
                onChange={(e) => handleChange("line1", e.target.value)}
                autoComplete="address-line1"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="addr-line2">
                Address line 2 <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                id="addr-line2"
                className="field"
                placeholder="Area, landmark"
                value={form.line2}
                onChange={(e) => handleChange("line2", e.target.value)}
                autoComplete="address-line2"
              />
            </div>

            <div>
              <label className="label" htmlFor="addr-city">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-city"
                className="field"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="addr-state">
                State <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-state"
                className="field"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
                autoComplete="address-level1"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <span className="label">Address type</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TYPE_META) as AddressType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleChange("type", t)}
                    aria-pressed={form.type === t}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold border transition-colors",
                      form.type === t
                        ? "bg-brand text-white border-brand"
                        : "bg-white text-ink border-line hover:border-brand-light"
                    )}
                  >
                    <Icon name={TYPE_META[t].icon} size={16} />
                    {TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand"
                checked={form.isDefault}
                onChange={(e) => handleChange("isDefault", e.target.checked)}
              />
              Set as my default delivery address
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" size="sm">
              {form.id ? "Save changes" : "Save address"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {addresses.length === 0 && !showForm ? (
        <div className="card-surface">
          <EmptyState
            emoji="📍"
            title="No saved addresses"
            message="Add a delivery address to speed up your checkout next time."
          >
            <Button onClick={openAdd}>
              <Icon name="plus" size={16} className="mr-1.5" />
              Add new address
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div key={addr.id} className="card-surface p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Icon name={TYPE_META[addr.type].icon} size={16} className="text-brand" />
                  {TYPE_META[addr.type].label}
                </span>
                {addr.isDefault && (
                  <Badge variant="brand">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="check" size={12} />
                      Default
                    </span>
                  </Badge>
                )}
              </div>

              <address className="not-italic text-sm leading-relaxed text-muted flex-1">
                <span className="font-semibold text-ink">{addr.fullName}</span>
                <br />
                {addr.line1}
                {addr.line2 ? (
                  <>
                    <br />
                    {addr.line2}
                  </>
                ) : null}
                <br />
                {addr.city}, {addr.state} {addr.pincode}
                <br />
                {addr.country}
                <br />
                <span className="inline-flex items-center gap-1 mt-1.5">
                  <Icon name="phone" size={14} /> {addr.phone}
                </span>
              </address>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-dark transition-colors"
                >
                  <Icon name="edit" size={14} />
                  Edit
                </button>
                <span className="text-line" aria-hidden>
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  <Icon name="trash" size={14} />
                  Delete
                </button>
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="ml-auto text-sm font-semibold text-muted hover:text-ink transition-colors"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
