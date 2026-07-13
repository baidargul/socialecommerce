"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import type { CategoryItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { apiFetch } from "@/lib/api-url";

type QuickEditDraft = {
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  stockQuantity: string;
  sku: string;
  tags: string[];
};

type ProductQuickEditRowProps = {
  product: Product;
  categories: CategoryItem[];
  colSpan: number;
  onCancel: () => void;
};

type ApiError = {
  error?: {
    message?: string;
  };
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function initialDraft(
  product: Product,
  categories: CategoryItem[],
): QuickEditDraft {
  const category = categories.find((item) => item.name === product.category);
  return {
    name: product.name,
    slug: product.slug,
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
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase text-zinc-500">
      <span>{label}</span>
      {children}
    </label>
  );
}

function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-9 min-w-0 rounded border border-zinc-200 bg-white px-3 text-sm font-bold normal-case text-zinc-950 outline-none transition focus:border-[#d62976]"
    />
  );
}

export function ProductQuickEditRow({
  product,
  categories,
  colSpan,
  onCancel,
}: ProductQuickEditRowProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuickEditDraft>(() =>
    initialDraft(product, categories),
  );
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categories),
    [categories],
  );
  const selectedCategory = categories.find(
    (category) => category.id === draft.categoryId,
  );
  const generatedSlug = slugify(draft.name);
  const activeSlug = draft.slug || generatedSlug;
  const price = Number(draft.price || 0);

  function update<K extends keyof QuickEditDraft>(
    key: K,
    value: QuickEditDraft[K],
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
      draft.tags.filter((tag) => tag !== value),
    );
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addTag();
  }

  async function submitQuickEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const formData = new FormData();
    formData.set("name", draft.name);
    formData.set("slug", activeSlug);
    formData.set("shortDescription", product.shortDescription);
    formData.set("description", product.description);
    formData.set("category", selectedCategory?.name ?? draft.categoryName);
    formData.set("price", draft.price);
    formData.set("originalPrice", draft.originalPrice);
    formData.set("discountPercent", draft.discountPercent);
    formData.set("stockQuantity", draft.stockQuantity);
    formData.set("sku", draft.sku);
    formData.set("tags", JSON.stringify(draft.tags));
    formData.set("images", JSON.stringify(product.images));
    formData.set("primaryMediaIndex", "0");

    const response = await apiFetch(`/api/v1/products/${product.id}`, {
      method: "PATCH",
      body: formData,
    });
    const body = (await response.json()) as ApiError;
    setSaving(false);

    if (!response.ok) {
      setError(body.error?.message ?? "Product could not be updated.");
      return;
    }

    router.refresh();
    onCancel();
  }

  return (
    <tr className="border-b border-zinc-100 bg-[#fff8fb]">
      <td colSpan={colSpan} className="px-4 py-4">
        <form onSubmit={submitQuickEdit} className="grid gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-black text-zinc-950">Quick Edit</h4>
              <p className="text-xs font-bold text-zinc-500">{product.name}</p>
            </div>
            <div className="text-sm font-black text-[#d62976]">
              {formatPrice(price > 0 ? price : 0)}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <Field label="Name">
              <TextField
                value={draft.name}
                onChange={(event) => update("name", event.target.value)}
                required
              />
            </Field>
            <Field label="Slug">
              <TextField
                value={draft.slug}
                onChange={(event) => update("slug", event.target.value)}
                placeholder={generatedSlug}
              />
            </Field>
            <SearchableDropdown
              label="Category"
              value={draft.categoryId}
              options={categoryOptions}
              onChange={(value) => update("categoryId", value)}
              placeholder={draft.categoryName || "Select category"}
            />
            <Field label="SKU">
              <TextField
                value={draft.sku}
                onChange={(event) => update("sku", event.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 lg:grid-cols-4">
            <Field label="Original price">
              <TextField
                value={draft.originalPrice}
                onChange={(event) => updateOriginalPrice(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
              />
            </Field>
            <Field label="Discount %">
              <TextField
                value={draft.discountPercent}
                onChange={(event) => updateDiscount(event.target.value)}
                type="number"
                min="0"
                max="95"
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

          <div className="grid gap-2">
            <Field label="Inventory tags">
              <div className="flex gap-2">
                <TextField
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={onTagKeyDown}
                  placeholder="Type tag and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addTag()}
                  className="h-9 rounded border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700"
                >
                  Add
                </button>
              </div>
            </Field>
            {draft.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-[#d62976]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-10 items-center gap-2 rounded border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-700"
            >
              <X className="size-4" />
              Cancel
            </button>
            <button
              disabled={saving}
              className="inline-flex min-h-10 items-center gap-2 rounded bg-[#d62976] px-4 text-sm font-black text-white disabled:opacity-60"
            >
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
