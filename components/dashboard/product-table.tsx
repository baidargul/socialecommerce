"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckSquare, Layers3, PackageCheck, Trash2, X } from "lucide-react";
import { ProductQuickEditRow } from "@/components/dashboard/product-quick-edit-row";
import { ProductRowActions } from "@/components/dashboard/product-row-actions";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import type { CategoryItem, Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { apiFetch } from "@/lib/api-url";

type ProductTableProps = {
  products: Product[];
  categories: CategoryItem[];
};

type BatchOperation = "delete" | "quantity" | "status" | "category";
type QuantityMode = "set" | "increase" | "decrease";
type BatchResponse = {
  error?: {
    message?: string;
  };
};

const columnCount = 7;

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

export function ProductTable({ products, categories }: ProductTableProps) {
  const router = useRouter();
  const [quickEditProductId, setQuickEditProductId] = useState<string | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [operation, setOperation] = useState<BatchOperation | null>(null);
  const [quantityMode, setQuantityMode] = useState<QuantityMode>("set");
  const [quantity, setQuantity] = useState("0");
  const [status, setStatus] = useState<"ACTIVE" | "OUT_OF_STOCK">("ACTIVE");
  const [categoryId, setCategoryId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const productIds = useMemo(
    () => products.map((product) => product.id),
    [products],
  );
  const selectedProductIds = selectedIds.filter((id) =>
    productIds.includes(id),
  );
  const categoryOptions = useMemo(
    () => flattenCategoryOptions(categories),
    [categories],
  );
  const selectedCategory = categories.find(
    (category) => category.id === categoryId,
  );
  const allSelected =
    productIds.length > 0 && selectedProductIds.length === productIds.length;
  const someSelected = selectedProductIds.length > 0;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : productIds);
  }

  function toggleProduct(productId: string) {
    setSelectedIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  }

  function clearBatchState() {
    setSelectedIds([]);
    setOperation(null);
    setConfirmDelete(false);
    setError("");
  }

  function activateOperation(nextOperation: BatchOperation) {
    setOperation(nextOperation);
    setConfirmDelete(nextOperation === "delete");
    setError("");
  }

  function closeOperationDialog() {
    setOperation(null);
    setConfirmDelete(false);
    setError("");
  }

  async function submitBatch(nextOperation = operation) {
    if (!nextOperation || !selectedProductIds.length) return;
    setError("");

    if (nextOperation === "delete" && !confirmDelete) return;
    if (nextOperation === "category" && !selectedCategory) {
      setError("Please select a category.");
      return;
    }
    if (nextOperation === "quantity" && Number(quantity) < 0) {
      setError("Quantity must be zero or more.");
      return;
    }

    setSaving(true);
    const response = await apiFetch("/api/v1/products/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: selectedProductIds,
        operation: nextOperation,
        quantityMode: nextOperation === "quantity" ? quantityMode : undefined,
        quantity: nextOperation === "quantity" ? Number(quantity) : undefined,
        status: nextOperation === "status" ? status : undefined,
        category:
          nextOperation === "category" ? selectedCategory?.name : undefined,
      }),
    });
    const body = (await response.json()) as BatchResponse;
    setSaving(false);

    if (!response.ok) {
      setError(body.error?.message ?? "Batch operation failed.");
      return;
    }

    clearBatchState();
    router.refresh();
  }

  return (
    <div>
      {someSelected ? (
        <div className="flex flex-wrap items-end gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="mr-auto">
            <p className="text-sm font-black text-zinc-950">
              {selectedProductIds.length} selected
            </p>
            <p className="text-xs font-bold text-zinc-500">
              Choose a batch operation for selected products.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => activateOperation("quantity")}
              className="inline-flex min-h-9 items-center gap-2 rounded border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700"
            >
              <Layers3 className="size-4" />
              Quantity
            </button>
            <button
              type="button"
              onClick={() => activateOperation("status")}
              className="inline-flex min-h-9 items-center gap-2 rounded border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700"
            >
              <PackageCheck className="size-4" />
              Status
            </button>
            <button
              type="button"
              onClick={() => activateOperation("category")}
              className="inline-flex min-h-9 items-center gap-2 rounded border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-700"
            >
              <CheckSquare className="size-4" />
              Category
            </button>
            <button
              type="button"
              onClick={() => activateOperation("delete")}
              className="inline-flex min-h-9 items-center gap-2 rounded border border-red-100 bg-white px-3 text-xs font-black text-red-600"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={clearBatchState}
              className="inline-flex min-h-9 items-center gap-2 rounded border border-zinc-200 bg-white px-3 text-xs font-black text-zinc-600"
            >
              <X className="size-4" />
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {operation ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-5">
              <div>
                <h3 className="font-black text-zinc-950">
                  {operation === "quantity"
                    ? "Batch Quantity"
                    : operation === "status"
                      ? "Batch Status"
                      : operation === "category"
                        ? "Batch Category"
                        : "Delete Products"}
                </h3>
                <p className="text-xs font-bold text-zinc-500">
                  {selectedProductIds.length} selected products
                </p>
              </div>
              <button
                type="button"
                onClick={closeOperationDialog}
                className="grid size-9 place-items-center rounded border border-zinc-200 text-zinc-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5">
              {operation === "quantity" ? (
                <>
                  <div className="grid gap-1 text-xs font-black uppercase text-zinc-500">
                    <span>Mode</span>
                    <div className="grid grid-cols-3 overflow-hidden rounded border border-zinc-200 bg-white normal-case">
                      {[
                        ["set", "Set exact"],
                        ["increase", "Increase"],
                        ["decrease", "Decrease"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setQuantityMode(value as QuantityMode)}
                          className={`h-10 text-xs font-black ${quantityMode === value ? "bg-[#d62976] text-white" : "text-zinc-700 hover:bg-zinc-50"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="grid gap-1 text-xs font-black uppercase text-zinc-500">
                    Quantity
                    <input
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value)}
                      type="number"
                      min="0"
                      className="h-10 rounded border border-zinc-200 px-3 text-sm font-bold normal-case text-zinc-950 outline-none focus:border-[#d62976]"
                    />
                  </label>
                </>
              ) : null}

              {operation === "status" ? (
                <div className="grid gap-1 text-xs font-black uppercase text-zinc-500">
                  <span>Status</span>
                  <div className="grid grid-cols-2 overflow-hidden rounded border border-zinc-200 bg-white normal-case">
                    {[
                      ["ACTIVE", "Active"],
                      ["OUT_OF_STOCK", "Out of stock"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setStatus(value as "ACTIVE" | "OUT_OF_STOCK")
                        }
                        className={`h-10 text-xs font-black ${status === value ? "bg-[#d62976] text-white" : "text-zinc-700 hover:bg-zinc-50"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {operation === "category" ? (
                <SearchableDropdown
                  label="Category"
                  value={categoryId}
                  options={categoryOptions}
                  onChange={setCategoryId}
                  placeholder="Search category"
                />
              ) : null}

              {operation === "delete" ? (
                <div className="rounded border border-red-100 bg-red-50 px-3 py-3">
                  <p className="text-sm font-bold text-red-700">
                    Delete {selectedProductIds.length} selected products? This
                    also removes them from the timeline.
                  </p>
                </div>
              ) : null}

              {error ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeOperationDialog}
                  className="min-h-10 rounded border border-zinc-200 px-4 text-sm font-black text-zinc-700"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  type="button"
                  onClick={() => submitBatch(operation)}
                  className={`min-h-10 rounded px-4 text-sm font-black text-white disabled:opacity-60 ${operation === "delete" ? "bg-red-600" : "bg-[#d62976]"}`}
                >
                  {saving
                    ? operation === "delete"
                      ? "Deleting..."
                      : "Applying..."
                    : operation === "delete"
                      ? "Confirm delete"
                      : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="w-10 px-4 py-3 font-black">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all products"
                  className="size-4 rounded border-zinc-300 accent-[#d62976]"
                />
              </th>
              <th className="px-4 py-3 font-black">Product</th>
              <th className="px-4 py-3 font-black">Category</th>
              <th className="px-4 py-3 font-black">Stock</th>
              <th className="px-4 py-3 font-black">Price</th>
              <th className="px-4 py-3 font-black">Status</th>
              <th className="px-4 py-3 font-black" aria-label="Options" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const quickEditOpen = quickEditProductId === product.id;
              const selected = selectedProductIds.includes(product.id);
              return (
                <Fragment key={product.id}>
                  <tr
                    className={`border-b border-zinc-100 last:border-b-0 ${selected ? "bg-[#fff8fb]" : ""}`}
                  >
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProduct(product.id)}
                        aria-label={`Select ${product.name}`}
                        className="size-4 rounded border-zinc-300 accent-[#d62976]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/dashboard/products/${product.id}/edit`}
                          className="font-black text-zinc-950 hover:text-[#d62976] hover:underline"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-500">
                          <span>{product.sku || product.slug}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuickEditProductId(
                                quickEditOpen ? null : product.id,
                              )
                            }
                            className="font-black text-[#d62976] hover:underline"
                          >
                            Quick Edit
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-600">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-700">
                      {product.stockQuantity}
                    </td>
                    <td className="px-4 py-3 font-black text-zinc-950">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-1 text-xs font-black ${product.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ProductRowActions product={product} />
                    </td>
                  </tr>
                  {quickEditOpen ? (
                    <ProductQuickEditRow
                      product={product}
                      categories={categories}
                      colSpan={columnCount}
                      onCancel={() => setQuickEditProductId(null)}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
