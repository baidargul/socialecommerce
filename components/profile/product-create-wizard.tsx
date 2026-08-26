"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PackageCheck, Plus, Tag } from "lucide-react";
import type { CategoryItem, Product } from "@/lib/types";
import { apiFetch } from "@/lib/api-url";
import { formatPrice } from "@/lib/utils";
import { MobileWizardShell } from "@/components/profile/mobile-wizard-shell";
import {
  clearWizardMedia,
  WizardMediaPicker,
  type WizardMedia,
} from "@/components/profile/wizard-media-picker";

type ApiEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
};
type Draft = {
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  stockQuantity: string;
  sku: string;
};
const emptyDraft: Draft = {
  name: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  price: "",
  originalPrice: "",
  discountPercent: "",
  stockQuantity: "1",
  sku: "",
};
const steps = ["Media", "Details", "Pricing", "Review"];
const inputClass =
  "min-h-12 w-full min-w-0 rounded-2xl border border-zinc-200 bg-white px-4 text-base font-medium outline-none transition focus:border-zinc-950";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-zinc-800">
      <span>
        {label}
        {optional ? (
          <span className="ml-1 font-medium text-zinc-400">Optional</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function ProductCreateWizard({
  categories,
  onClose,
  onCreated,
}: {
  categories: CategoryItem[];
  onClose: () => void;
  onCreated: (product: Product) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [media, setMedia] = useState<WizardMedia[]>([]);
  const mediaRef = useRef<WizardMedia[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const generatedSlug = useMemo(() => slugify(draft.name), [draft.name]);
  const category = categories.find((item) => item.id === draft.categoryId);
  const price = Number(draft.price || 0);
  const originalPrice = Number(draft.originalPrice || 0);
  const discount = Number(draft.discountPercent || 0);
  const stock = Number(draft.stockQuantity || 0);
  const dirty = Boolean(
    media.length ||
    tags.length ||
    Object.entries(draft).some(
      ([key, value]) => value !== emptyDraft[key as keyof Draft],
    ),
  );

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);
  useEffect(
    () => () => {
      clearWizardMedia(mediaRef.current);
    },
    [],
  );

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  function updateOriginalPrice(value: string) {
    setDraft((current) => {
      const original = Number(value);
      const currentPrice = Number(current.price);
      return {
        ...current,
        originalPrice: value,
        discountPercent:
          original > 0 && currentPrice > 0 && original >= currentPrice
            ? String(Math.round(((original - currentPrice) / original) * 100))
            : current.discountPercent,
      };
    });
  }

  function updatePrice(value: string) {
    setDraft((current) => {
      const original = Number(current.originalPrice);
      const currentPrice = Number(value);
      return {
        ...current,
        price: value,
        discountPercent:
          original > 0 && currentPrice > 0 && original >= currentPrice
            ? String(Math.round(((original - currentPrice) / original) * 100))
            : current.discountPercent,
      };
    });
  }

  function updateDiscount(value: string) {
    setDraft((current) => {
      const original = Number(current.originalPrice);
      const nextDiscount = Number(value);
      return {
        ...current,
        discountPercent: value,
        price:
          original > 0 && nextDiscount >= 0 && nextDiscount <= 95
            ? (original * (1 - nextDiscount / 100)).toFixed(2)
            : current.price,
      };
    });
  }

  function addTag() {
    const normalized = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized || tags.includes(normalized)) return;
    if (tags.length >= 20) {
      setError("You can add up to 20 tags.");
      return;
    }
    setTags((current) => [...current, normalized]);
    setTagInput("");
    setError("");
  }

  function validateCurrentStep() {
    if (step === 1 && draft.name.trim().length < 2)
      return "Enter a product name with at least 2 characters.";
    if (
      step === 2 &&
      (!(price > 0) ||
        !Number.isInteger(stock) ||
        stock < 0 ||
        draft.stockQuantity === "")
    )
      return "Enter a valid price and stock quantity.";
    return "";
  }

  function next() {
    const message = validateCurrentStep();
    if (message) {
      setError(message);
      return;
    }
    setError("");
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function createProduct() {
    if (draft.name.trim().length < 2) {
      setStep(1);
      setError("Enter a product name with at least 2 characters.");
      return;
    }
    if (!(price > 0) || !Number.isInteger(stock) || stock < 0) {
      setStep(2);
      setError("Enter a valid price and stock quantity.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.set("name", draft.name.trim());
      formData.set("slug", draft.slug || generatedSlug);
      formData.set("shortDescription", draft.shortDescription.trim());
      formData.set("description", draft.description.trim());
      formData.set("category", category?.name ?? "");
      formData.set("price", draft.price);
      if (draft.originalPrice)
        formData.set("originalPrice", draft.originalPrice);
      if (draft.discountPercent)
        formData.set("discountPercent", draft.discountPercent);
      formData.set("stockQuantity", draft.stockQuantity);
      formData.set("sku", draft.sku.trim());
      formData.set("tags", JSON.stringify(tags));
      formData.set("images", "[]");
      formData.set("primaryMediaIndex", "0");
      media.forEach((item) => formData.append("media", item.file));
      const response = await apiFetch("/api/v1/products", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as ApiEnvelope<Product>;
      if (!response.ok || !body.success || !body.data) {
        setError(body.error?.message ?? "Product could not be created.");
        return;
      }
      clearWizardMedia(media);
      mediaRef.current = [];
      onCreated(body.data);
      router.refresh();
      onClose();
    } catch {
      setError("Could not reach the product service.");
    } finally {
      setCreating(false);
    }
  }

  const footer = (
    <div className="flex gap-3">
      {step > 0 ? (
        <button
          type="button"
          disabled={creating}
          onClick={() => {
            setError("");
            setStep((current) => current - 1);
          }}
          className="min-h-12 flex-1 rounded-full bg-zinc-100 px-5 text-sm font-black disabled:opacity-50"
        >
          Back
        </button>
      ) : null}
      <button
        type="button"
        disabled={creating}
        onClick={step === steps.length - 1 ? () => void createProduct() : next}
        className="inline-flex min-h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-[#d62976] px-5 text-sm font-black text-white disabled:opacity-50"
      >
        {step === steps.length - 1 ? (
          <>
            <Plus className="size-4" />
            {creating ? "Creating..." : "Create Product"}
          </>
        ) : (
          "Continue"
        )}
      </button>
    </div>
  );

  return (
    <MobileWizardShell
      title="New Product"
      steps={steps}
      currentStep={step}
      dirty={dirty}
      busy={creating}
      onBack={step > 0 ? () => setStep((current) => current - 1) : undefined}
      onClose={onClose}
      footer={footer}
    >
      {step === 0 ? (
        <section>
          <h3 className="text-2xl font-black">Show your product</h3>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            Add up to 8 photos or videos. The first file becomes the cover.
          </p>
          <div className="mt-5">
            <WizardMediaPicker
              media={media}
              error={mediaError}
              onChange={(nextMedia, nextError = "") => {
                setMedia(nextMedia);
                setMediaError(nextError);
              }}
            />
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="grid gap-5">
          <WizardHeading
            title="Product details"
            text="Give customers the information they need."
          />
          <Field label="Product name">
            <input
              value={draft.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={120}
              autoFocus
              placeholder="Scented Candle"
              className={inputClass}
            />
          </Field>
          <Field label="Category" optional>
            <select
              value={draft.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
              className={inputClass}
            >
              <option value="">Uncategorized</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description" optional>
            <input
              value={draft.shortDescription}
              onChange={(event) =>
                update("shortDescription", event.target.value)
              }
              maxLength={240}
              placeholder="A short product summary"
              className={inputClass}
            />
          </Field>
          <Field label="Description" optional>
            <textarea
              value={draft.description}
              onChange={(event) => update("description", event.target.value)}
              maxLength={2000}
              rows={5}
              placeholder="Materials, usage, sizing, shipping notes..."
              className={inputClass + " resize-none py-3"}
            />
          </Field>
          <Field label="Product URL" optional>
            <input
              value={draft.slug}
              onChange={(event) => update("slug", slugify(event.target.value))}
              maxLength={140}
              placeholder={generatedSlug || "product-name"}
              className={inputClass}
            />
            {generatedSlug && !draft.slug ? (
              <span className="text-xs font-medium text-zinc-400">
                Generated: {generatedSlug}
              </span>
            ) : null}
          </Field>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="grid gap-5">
          <WizardHeading
            title="Price and stock"
            text="Set the selling price and available quantity."
          />
          <Field label="Sale price">
            <input
              value={draft.price}
              onChange={(event) => updatePrice(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              placeholder="24.99"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Original price" optional>
              <input
                value={draft.originalPrice}
                onChange={(event) => updateOriginalPrice(event.target.value)}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                placeholder="35.00"
                className={inputClass}
              />
            </Field>
            <Field label="Discount %" optional>
              <input
                value={draft.discountPercent}
                onChange={(event) => updateDiscount(event.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
                max="95"
                placeholder="20"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Stock quantity">
            <input
              value={draft.stockQuantity}
              onChange={(event) => update("stockQuantity", event.target.value)}
              type="number"
              inputMode="numeric"
              min="0"
              max="999999"
              className={inputClass}
            />
          </Field>
          <Field label="SKU" optional>
            <input
              value={draft.sku}
              onChange={(event) => update("sku", event.target.value)}
              maxLength={80}
              placeholder="CANDLE-001"
              className={inputClass}
            />
          </Field>
          <div className="rounded-2xl bg-zinc-50 p-4 text-sm font-bold text-zinc-600">
            Selling price:{" "}
            <span className="text-[#d62976]">
              {formatPrice(price > 0 ? price : 0)}
            </span>
            {discount > 0 ? (
              <span className="ml-2 text-emerald-700">{discount}% off</span>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section>
          <WizardHeading
            title="Review product"
            text="Add optional tags, then confirm your listing."
          />
          <div className="mt-5 grid gap-2">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <Tag className="size-4" /> Inventory tags
            </span>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                maxLength={40}
                placeholder="featured"
                className={inputClass}
              />
              <button
                type="button"
                onClick={addTag}
                className="shrink-0 rounded-2xl bg-zinc-100 px-4 text-sm font-black"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setTags((current) => current.filter((item) => item !== tag))
                  }
                  className="rounded-full bg-[#fff1f7] px-3 py-1 text-xs font-black text-[#d62976]"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200">
            <div className="grid aspect-square place-items-center bg-zinc-100">
              {media[0]?.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media[0].previewUrl}
                  alt="Product preview"
                  className="size-full object-cover"
                />
              ) : media[0]?.type === "video" ? (
                <video
                  src={media[0].previewUrl}
                  className="size-full object-cover"
                  controls
                />
              ) : (
                <PackageCheck className="size-12 text-zinc-400" />
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                {category?.name || "Uncategorized"}
              </p>
              <h4 className="mt-1 text-xl font-black">{draft.name}</h4>
              {draft.shortDescription ? (
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  {draft.shortDescription}
                </p>
              ) : null}
              <div className="mt-3 flex items-end gap-2">
                <p className="text-2xl font-black text-[#d62976]">
                  {formatPrice(price)}
                </p>
                {originalPrice > 0 ? (
                  <p className="pb-1 text-sm font-bold text-zinc-400 line-through">
                    {formatPrice(originalPrice)}
                  </p>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-bold text-zinc-600">
                {stock} in stock · {stock > 0 ? "Active" : "Out of stock"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}
    </MobileWizardShell>
  );
}

function WizardHeading({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-1 text-sm font-medium text-zinc-500">{text}</p>
    </div>
  );
}
