"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import type { AddressInput, UserAddress } from "@/lib/types";
import { cn } from "@/lib/utils";

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
};

const emptyForm: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
  isDefault: false,
};

async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return (await response.json()) as ApiEnvelope<T>;
  return { success: false, data: null, error: { code: "INVALID_RESPONSE", message: "The address service returned an invalid response." } };
}

function addressToForm(address: UserAddress): AddressInput {
  return {
    label: address.label ?? "",
    fullName: address.fullName,
    phone: address.phone,
    addressLine: address.addressLine,
    city: address.city,
    state: address.state ?? "",
    country: address.country,
    postalCode: address.postalCode ?? "",
    isDefault: address.isDefault,
  };
}

export function AddressBookManager() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const editingAddress = useMemo(() => addresses.find((address) => address.id === editingId), [addresses, editingId]);

  async function loadAddresses() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/account/addresses");
      const body = await readEnvelope<{ items: UserAddress[]; nextCursor: null }>(response);
      if (!response.ok || !body.success || !body.data) {
        setError(body.error?.message ?? "Could not load addresses.");
        return;
      }
      setAddresses(body.data.items);
    } catch {
      setError("Could not reach the address service.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/account/addresses")
      .then(async (response) => {
        const body = await readEnvelope<{ items: UserAddress[]; nextCursor: null }>(response);
        if (cancelled) return;
        if (!response.ok || !body.success || !body.data) {
          setError(body.error?.message ?? "Could not load addresses.");
          return;
        }
        setAddresses(body.data.items);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the address service.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof AddressInput, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function saveAddress() {
    setSaving(true);
    setMessage("");
    setError("");
    const path = editingId ? `/api/v1/account/addresses/${editingId}` : "/api/v1/account/addresses";
    const method = editingId ? "PATCH" : "POST";

    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await readEnvelope<{ address: UserAddress }>(response);
      if (!response.ok || !body.success || !body.data?.address) {
        setError(body.error?.message ?? "Could not save address.");
        return;
      }
      setMessage(editingId ? "Address updated." : "Address added.");
      resetForm();
      await loadAddresses();
    } catch {
      setError("Could not reach the address service.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(addressId: string) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/v1/account/addresses/${addressId}`, { method: "DELETE" });
      const body = await readEnvelope<{ ok: boolean }>(response);
      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Could not delete address.");
        return;
      }
      if (editingId === addressId) resetForm();
      setMessage("Address deleted.");
      await loadAddresses();
    } catch {
      setError("Could not reach the address service.");
    } finally {
      setSaving(false);
    }
  }

  async function setDefaultAddress(addressId: string) {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/v1/account/addresses/${addressId}/default`, { method: "PATCH" });
      const body = await readEnvelope<{ address: UserAddress }>(response);
      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Could not set default address.");
        return;
      }
      setMessage("Default address updated.");
      await loadAddresses();
    } catch {
      setError("Could not reach the address service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-[#d62976]" />
              <h2 className="text-xl font-black">Address Book</h2>
            </div>
            <p className="mt-1 text-sm font-medium text-zinc-500">Save addresses and choose a default for faster checkout.</p>
          </div>
          <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-600">{addresses.length} saved</span>
        </div>

        <div className="mt-5 grid gap-3">
          {loading ? <p className="rounded-lg bg-zinc-50 p-4 text-sm font-bold text-zinc-500">Loading addresses...</p> : null}
          {!loading && !addresses.length ? (
            <p className="rounded-lg bg-zinc-50 p-4 text-sm font-bold text-zinc-500">No saved addresses yet.</p>
          ) : null}
          {addresses.map((address) => (
            <article key={address.id} className={cn("rounded-lg border p-4", address.isDefault ? "border-[#d62976] bg-[#fff1f7]" : "border-zinc-100 bg-white")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{address.label || "Address"}</p>
                    {address.isDefault ? <span className="rounded bg-white px-2 py-1 text-xs font-black text-[#d62976]">Default</span> : null}
                  </div>
                  <p className="mt-1 text-sm font-bold text-zinc-700">{address.fullName}</p>
                  <p className="text-sm font-medium text-zinc-500">{address.phone}</p>
                  <p className="mt-2 text-sm font-medium text-zinc-600">
                    {address.addressLine}, {address.city}, {address.country}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="grid size-9 place-items-center rounded-full bg-white text-zinc-700 shadow-sm"
                    onClick={() => {
                      setEditingId(address.id);
                      setForm(addressToForm(address));
                    }}
                    aria-label="Edit address"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="grid size-9 place-items-center rounded-full bg-white text-red-600 shadow-sm"
                    onClick={() => void deleteAddress(address.id)}
                    aria-label="Delete address"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              {!address.isDefault ? (
                <Button className="mt-3 min-h-9 px-4" intent="secondary" icon={<Star className="size-4" />} disabled={saving} onClick={() => void setDefaultAddress(address.id)}>
                  Make Default
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <Plus className="size-5 text-zinc-500" />
          <h2 className="text-xl font-black">{editingAddress ? "Edit Address" : "Add Address"}</h2>
        </div>
        <div className="mt-5 grid gap-4">
          <TextInput label="Label" placeholder="Home, Office" value={form.label ?? ""} onChange={(event) => updateField("label", event.target.value)} />
          <TextInput label="Full name" value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
          <TextInput label="Phone" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
          <TextInput label="Address" value={form.addressLine} onChange={(event) => updateField("addressLine", event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="City" value={form.city} onChange={(event) => updateField("city", event.target.value)} />
            <TextInput label="State" value={form.state ?? ""} onChange={(event) => updateField("state", event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Country" value={form.country} onChange={(event) => updateField("country", event.target.value)} />
            <TextInput label="Postal code" value={form.postalCode ?? ""} onChange={(event) => updateField("postalCode", event.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
            <input type="checkbox" checked={Boolean(form.isDefault)} onChange={(event) => updateField("isDefault", event.target.checked)} />
            Set as default address
          </label>
        </div>
        {message ? <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button loading={saving} icon={<CheckCircle2 className="size-4" />} onClick={saveAddress}>
            {editingAddress ? "Save Address" : "Add Address"}
          </Button>
          {editingAddress ? (
            <Button intent="secondary" disabled={saving} onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
