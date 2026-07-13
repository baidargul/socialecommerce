"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  Plus,
  Sparkles,
  Star,
  Video,
  X,
} from "lucide-react";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import type { CategoryItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { apiFetch } from "@/lib/api-url";

type ApiError = {
  error?: {
    message?: string;
  };
};

type MediaDraft = {
  id: string;
  file?: File;
  previewUrl: string;
  type: "image" | "video";
  url?: string;
  fileName?: string;
};

type ProductDraft = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  stockQuantity: string;
  sku: string;
  tags: string[];
  media: MediaDraft[];
  primaryMediaId: string;
};

const emptyDraft: ProductDraft = {
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  categoryName: "",
  price: "",
  originalPrice: "",
  discountPercent: "",
  stockQuantity: "1",
  sku: "",
  tags: [],
  media: [],
  primaryMediaId: "",
};

const quickTags = [
  "new-arrival",
  "featured",
  "low-stock",
  "seasonal",
  "clearance",
  "top-seller",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-zinc-600">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="text-xs font-medium text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 min-w-0 rounded border border-zinc-200 px-3 font-medium text-zinc-950 outline-none transition focus:border-[#d62976]"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="rounded border border-zinc-200 px-3 py-2 font-medium text-zinc-950 outline-none transition focus:border-[#d62976]"
    />
  );
}

function flattenCategoryOptions(categories: CategoryItem[]) {
  const children = new Map<string, CategoryItem[]>();
  categories.forEach((category) => {
    const key = category.parentId ?? "root";
    children.set(key, [...(children.get(key) ?? []), category]);
  });

  const result: Array<{
    value: string;
    label: string;
    meta: string;
    depth: number;
  }> = [];
  function walk(parentId: string, depth: number) {
    (children.get(parentId) ?? []).forEach((category) => {
      result.push({
        value: category.id,
        label: category.name,
        meta: category.slug,
        depth,
      });
      walk(category.id, depth + 1);
    });
  }
  walk("root", 0);
  return result;
}

function getInitialDraft(
  product: Product | undefined,
  categories: CategoryItem[],
): ProductDraft {
  if (!product) return emptyDraft;
  const category = categories.find((item) => item.name === product.category);
  const media =
    product.media?.map((item) => ({
      id: crypto.randomUUID(),
      previewUrl: item.url,
      type: item.type,
      url: item.url,
      fileName: item.fileName,
    })) ??
    product.images.map((url) => ({
      id: crypto.randomUUID(),
      previewUrl: url,
      type: "image" as const,
      url,
    }));
  const primaryMedia = product.media?.find((item) => item.isPrimary);

  return {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: category?.id ?? "",
    categoryName: product.category === "Uncategorized" ? "" : product.category,
    price: String(product.price),
    originalPrice: product.originalPrice ? String(product.originalPrice) : "",
    discountPercent: product.discountPercent
      ? String(product.discountPercent)
      : "",
    stockQuantity: String(product.stockQuantity),
    sku: product.sku,
    tags: product.tags,
    media,
    primaryMediaId: primaryMedia
      ? (media.find((item) => item.url === primaryMedia.url)?.id ??
        media[0]?.id ??
        "")
      : (media[0]?.id ?? ""),
  };
}

export function ProductCreateForm({
  categories,
  product,
  onCreated,
  backHref,
  backLabel = "Products",
}: {
  categories: CategoryItem[];
  product?: Product;
  onCreated?: () => void;
  backHref?: string;
  backLabel?: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProductDraft>(() =>
    getInitialDraft(product, categories),
  );
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const mediaRef = useRef<MediaDraft[]>([]);

  useEffect(() => {
    mediaRef.current = draft.media;
  }, [draft.media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((media) =>
        URL.revokeObjectURL(media.previewUrl),
      );
    };
  }, []);

  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categories),
    [categories],
  );
  const selectedCategory = categories.find(
    (category) => category.id === draft.categoryId,
  );
  const generatedSlug = useMemo(() => slugify(draft.name), [draft.name]);
  const activeSlug = draft.slug || generatedSlug;
  const price = Number(draft.price || 0);
  const originalPrice = Number(draft.originalPrice || 0);
  const discountPercent = Number(draft.discountPercent || 0);
  const primaryMedia =
    draft.media.find((media) => media.id === draft.primaryMediaId) ??
    draft.media[0];
  const stock = Number(draft.stockQuantity || 0);
  const completion = [
    Boolean(draft.name.trim()),
    price > 0,
    stock >= 0 && draft.stockQuantity !== "",
    Boolean(selectedCategory),
    draft.tags.length > 0,
    draft.media.length > 0,
  ].filter(Boolean).length;

  function update<K extends keyof ProductDraft>(
    key: K,
    value: ProductDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateOriginalPrice(value: string) {
    setDraft((current) => {
      const next = { ...current, originalPrice: value };
      const original = Number(value);
      const currentPrice = Number(current.price);
      if (original > 0 && currentPrice > 0 && original >= currentPrice) {
        next.discountPercent = String(
          Math.round(((original - currentPrice) / original) * 100),
        );
      }
      return next;
    });
  }

  function updatePrice(value: string) {
    setDraft((current) => {
      const next = { ...current, price: value };
      const original = Number(current.originalPrice);
      const currentPrice = Number(value);
      if (original > 0 && currentPrice > 0 && original >= currentPrice) {
        next.discountPercent = String(
          Math.round(((original - currentPrice) / original) * 100),
        );
      }
      return next;
    });
  }

  function updateDiscount(value: string) {
    setDraft((current) => {
      const next = { ...current, discountPercent: value };
      const original = Number(current.originalPrice);
      const discount = Number(value);
      if (original > 0 && discount >= 0 && discount <= 95) {
        next.price = (original * (1 - discount / 100)).toFixed(2);
      }
      return next;
    });
  }

  function addTag(value = tagInput) {
    const normalized = value.trim().toLowerCase();
    if (!normalized || draft.tags.includes(normalized)) return;
    update("tags", [...draft.tags, normalized]);
    setTagInput("");
  }

  function removeTag(value: string) {
    update(
      "tags",
      draft.tags.filter((tagName) => tagName !== value),
    );
  }

  function addMedia(files: FileList | null) {
    if (!files?.length) return;
    const nextMedia = Array.from(files)
      .filter(
        (file) =>
          file.type.startsWith("image/") || file.type.startsWith("video/"),
      )
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
      }));
    setDraft((current) => ({
      ...current,
      media: [...current.media, ...nextMedia],
      primaryMediaId: current.primaryMediaId || nextMedia[0]?.id || "",
    }));
  }

  function removeMedia(id: string) {
    setDraft((current) => {
      const removed = current.media.find((media) => media.id === id);
      if (removed?.file) URL.revokeObjectURL(removed.previewUrl);
      const media = current.media.filter((item) => item.id !== id);
      return {
        ...current,
        media,
        primaryMediaId:
          current.primaryMediaId === id
            ? (media[0]?.id ?? "")
            : current.primaryMediaId,
      };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const formData = new FormData();
    const primaryMediaIndex = Math.max(
      0,
      draft.media.findIndex((media) => media.id === draft.primaryMediaId),
    );
    formData.set("name", draft.name);
    formData.set("slug", activeSlug);
    formData.set("shortDescription", draft.shortDescription);
    formData.set("description", draft.description);
    formData.set("category", selectedCategory?.name ?? draft.categoryName);
    formData.set("price", draft.price);
    if (draft.originalPrice) formData.set("originalPrice", draft.originalPrice);
    if (draft.discountPercent)
      formData.set("discountPercent", draft.discountPercent);
    formData.set("stockQuantity", draft.stockQuantity);
    formData.set("sku", draft.sku);
    formData.set("tags", JSON.stringify(draft.tags));
    formData.set("images", JSON.stringify([]));
    formData.set("primaryMediaIndex", String(primaryMediaIndex));
    draft.media.forEach((media) => {
      if (media.file) formData.append("media", media.file);
    });
    if (product && draft.media.every((media) => !media.file)) {
      const orderedMedia = [...draft.media].sort(
        (a, b) =>
          Number(b.id === draft.primaryMediaId) -
          Number(a.id === draft.primaryMediaId),
      );
      formData.set(
        "images",
        JSON.stringify(
          orderedMedia
            .filter((media) => media.type === "image")
            .map((media) => media.url ?? media.previewUrl),
        ),
      );
    }

    const response = await apiFetch(
      product ? `/api/v1/products/${product.id}` : "/api/v1/products",
      {
        method: product ? "PATCH" : "POST",
        body: formData,
      },
    );
    const body = (await response.json()) as ApiError;

    setLoading(false);
    if (!response.ok) {
      setError(body.error?.message ?? "Product could not be created.");
      return;
    }

    draft.media.forEach((media) => {
      if (media.file) URL.revokeObjectURL(media.previewUrl);
    });
    setDraft(product ? getInitialDraft(product, categories) : emptyDraft);
    setTagInput("");
    setSuccess(product ? "Product updated." : "Product created.");
    router.refresh();
    onCreated?.();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1fr_320px]">
      {backHref ? (
        <div className="flex flex-wrap items-center justify-between gap-3 xl:col-span-2">
          <Link
            href={backHref}
            className="inline-flex min-h-10 items-center gap-2 rounded border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-800"
          >
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
          <button
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[#d62976] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {loading
              ? product
                ? "Updating..."
                : "Creating..."
              : product
                ? "Update Product"
                : "Create Product"}
          </button>
        </div>
      ) : null}

      <div className="grid gap-5">
        <section className="rounded border border-zinc-200">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="font-black">Product Identity</h3>
          </div>
          <div className="grid gap-4 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
              <Field label="Product name">
                <TextField
                  value={draft.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                  placeholder="Scented Candle"
                />
              </Field>
              <Field
                label="Slug"
                hint={
                  generatedSlug && !draft.slug
                    ? `Generated: ${generatedSlug}`
                    : undefined
                }
              >
                <div className="flex gap-2">
                  <TextField
                    value={draft.slug}
                    onChange={(event) => update("slug", event.target.value)}
                    placeholder={generatedSlug || "product-slug"}
                  />
                  <button
                    type="button"
                    onClick={() => update("slug", generatedSlug)}
                    className="inline-flex h-10 items-center gap-1 rounded border border-zinc-200 px-3 text-xs font-black text-zinc-700"
                  >
                    <Sparkles className="size-4" />
                    Use
                  </button>
                </div>
              </Field>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <SearchableDropdown
                label="Category"
                value={draft.categoryId}
                options={categoryOptions}
                onChange={(value) => update("categoryId", value)}
                placeholder="Search category"
              />
              <Field label="SKU">
                <TextField
                  value={draft.sku}
                  onChange={(event) => update("sku", event.target.value)}
                  placeholder="CANDLE-001"
                />
              </Field>
            </div>
            <Field label="Short description">
              <TextField
                value={draft.shortDescription}
                onChange={(event) =>
                  update("shortDescription", event.target.value)
                }
                placeholder="Warm amber candle"
              />
            </Field>
            <Field label="Description">
              <TextArea
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
                rows={3}
                placeholder="Write product details, materials, usage, shipping notes..."
              />
            </Field>
          </div>
        </section>

        <section className="rounded border border-zinc-200">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="font-black">Pricing & Inventory</h3>
          </div>
          <div className="grid gap-4 p-4">
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <Field label="Original price">
                <TextField
                  value={draft.originalPrice}
                  onChange={(event) => updateOriginalPrice(event.target.value)}
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="35.00"
                />
              </Field>
              <Field label="Discount %">
                <TextField
                  value={draft.discountPercent}
                  onChange={(event) => updateDiscount(event.target.value)}
                  type="number"
                  min="0"
                  max="95"
                  placeholder="20"
                />
              </Field>
              <Field label="Sale price">
                <TextField
                  value={draft.price}
                  onChange={(event) => updatePrice(event.target.value)}
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="24.99"
                />
              </Field>
              <Field label="Stock">
                <TextField
                  value={draft.stockQuantity}
                  onChange={(event) =>
                    update("stockQuantity", event.target.value)
                  }
                  required
                  type="number"
                  min="0"
                />
              </Field>
            </div>
            <div className="rounded bg-zinc-50 px-3 py-2 text-sm font-bold text-zinc-600">
              Sale price:{" "}
              <span className="text-[#d62976]">
                {formatPrice(price > 0 ? price : 0)}
              </span>
              {originalPrice > 0 && discountPercent > 0 ? (
                <span className="ml-2 text-emerald-700">
                  Calculated from {discountPercent}% discount
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded border border-zinc-200">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="font-black">Media & Inventory Tags</h3>
          </div>
          <div className="grid gap-4 p-4">
            <Field
              label="Media files"
              hint="Select images and videos. Mark one as primary."
            >
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(event) => {
                  addMedia(event.target.files);
                  event.target.value = "";
                }}
                className="block w-full rounded border border-dashed border-zinc-300 px-3 py-6 text-sm font-bold text-zinc-600 file:mr-3 file:rounded file:border-0 file:bg-[#fff1f7] file:px-3 file:py-2 file:text-sm file:font-black file:text-[#d62976]"
              />
            </Field>
            {draft.media.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {draft.media.map((media) => {
                  const primary = media.id === draft.primaryMediaId;
                  return (
                    <div
                      key={media.id}
                      className={`overflow-hidden rounded border ${primary ? "border-[#d62976]" : "border-zinc-200"}`}
                    >
                      <div className="relative aspect-square bg-zinc-100">
                        {media.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={media.previewUrl}
                            alt={
                              media.file?.name ??
                              media.fileName ??
                              "Product media"
                            }
                            className="size-full object-cover"
                          />
                        ) : (
                          <video
                            src={media.previewUrl}
                            className="size-full object-cover"
                            muted
                          />
                        )}
                        <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-black text-zinc-700">
                          {media.type}
                        </span>
                      </div>
                      <div className="grid gap-2 p-2">
                        <p className="truncate text-xs font-bold text-zinc-600">
                          {media.file?.name ?? media.fileName ?? media.url}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => update("primaryMediaId", media.id)}
                            className={`inline-flex flex-1 items-center justify-center gap-1 rounded px-2 py-1 text-xs font-black ${primary ? "bg-[#d62976] text-white" : "bg-zinc-100 text-zinc-600"}`}
                          >
                            <Star className="size-3" />
                            Primary
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedia(media.id)}
                            className="rounded bg-zinc-100 px-2 text-zinc-600"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            <Field
              label="Inventory tags"
              hint="Used for sorting, filtering, and tracking inventory. These are not hashtags."
            >
              <div className="flex gap-2">
                <TextField
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Type tag and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addTag()}
                  className="h-10 rounded border border-zinc-200 px-3 text-sm font-black text-zinc-700"
                >
                  Add
                </button>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tagName) => (
                <button
                  key={tagName}
                  type="button"
                  onClick={() => addTag(tagName)}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600 hover:bg-[#fff1f7] hover:text-[#d62976]"
                >
                  {tagName}
                </button>
              ))}
            </div>
            {draft.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tagName) => (
                  <span
                    key={tagName}
                    className="inline-flex items-center gap-1 rounded-full bg-[#fff1f7] px-3 py-1 text-xs font-black text-[#d62976]"
                  >
                    {tagName}
                    <button type="button" onClick={() => removeTag(tagName)}>
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {error ? (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
            {success}
          </p>
        ) : null}
      </div>

      <aside className="grid content-start gap-4">
        <section className="rounded border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black">Live Preview</h3>
            <span
              className={`rounded px-2 py-1 text-xs font-black ${stock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-zinc-200 text-zinc-600"}`}
            >
              {stock > 0 ? "ACTIVE" : "OUT_OF_STOCK"}
            </span>
          </div>
          <div className="mt-4 overflow-hidden rounded border border-zinc-200 bg-white">
            <div className="grid aspect-square place-items-center bg-zinc-100">
              {primaryMedia?.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryMedia.previewUrl}
                  alt={
                    primaryMedia.file?.name ??
                    primaryMedia.fileName ??
                    "Product media"
                  }
                  className="size-full object-cover"
                />
              ) : primaryMedia?.type === "video" ? (
                <div className="grid size-full place-items-center">
                  <Video className="size-10 text-[#d62976]" />
                </div>
              ) : (
                <PackageCheck className="size-10 text-zinc-400" />
              )}
            </div>
            <div className="p-3">
              <p className="text-xs font-bold uppercase text-zinc-500">
                {selectedCategory?.name || "Category"}
              </p>
              <h4 className="mt-1 line-clamp-2 text-lg font-black">
                {draft.name || "Product name"}
              </h4>
              <p className="mt-2 text-xl font-black text-[#d62976]">
                {formatPrice(price > 0 ? price : 0)}
              </p>
              {originalPrice > 0 ? (
                <p className="text-sm font-bold text-zinc-400 line-through">
                  {formatPrice(originalPrice)}
                </p>
              ) : null}
              {discountPercent > 0 ? (
                <p className="mt-1 text-sm font-black text-emerald-600">
                  {discountPercent}% OFF
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded border border-zinc-200 p-4">
          <h3 className="font-black">Readiness</h3>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-[#d62976]"
              style={{ width: `${(completion / 6) * 100}%` }}
            />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            {[
              ["Name", Boolean(draft.name.trim())],
              ["Price", price > 0],
              ["Stock", stock >= 0 && draft.stockQuantity !== ""],
              ["Category", Boolean(selectedCategory)],
              ["Inventory tags", draft.tags.length > 0],
              ["Media", draft.media.length > 0],
            ].map(([label, done]) => (
              <div
                key={String(label)}
                className="flex items-center gap-2 font-bold text-zinc-600"
              >
                <CheckCircle2
                  className={`size-4 ${done ? "text-emerald-600" : "text-zinc-300"}`}
                />
                {label}
              </div>
            ))}
          </div>
        </section>

        {!backHref ? (
          <button
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#d62976] px-4 text-sm font-black text-white disabled:opacity-60"
          >
            <Plus className="size-4" />
            {loading
              ? product
                ? "Updating..."
                : "Creating..."
              : product
                ? "Update Product"
                : "Create Product"}
          </button>
        ) : null}
      </aside>
    </form>
  );
}
