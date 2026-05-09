"use client";

import { useState } from "react";
import { PackagePlus, X } from "lucide-react";
import { ProductCreateForm } from "@/components/dashboard/product-create-form";
import type { CategoryItem, Product } from "@/lib/types";

export function ProductCreateDialog({
  categories,
  product,
  trigger,
}: {
  categories: CategoryItem[];
  product?: Product;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const mode = product ? "edit" : "create";

  return (
    <>
      {trigger ? (
        <button type="button" onClick={() => setOpen(true)} className="contents">
          {trigger}
        </button>
      ) : (
        <button onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded bg-[#d62976] px-4 text-sm font-black text-white">
          <PackagePlus className="size-4" />
          Add Product
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="max-h-[92dvh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-5">
              <div>
                <h2 className="text-lg font-black">{mode === "edit" ? "Edit Product" : "Add Product"}</h2>
                <p className="text-xs font-bold text-zinc-500">{mode === "edit" ? "Update catalog item" : "Create catalog item"}</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded border border-zinc-200 text-zinc-600">
                <X className="size-4" />
              </button>
            </div>
            <div className="max-h-[calc(92dvh-56px)] overflow-y-auto p-5">
              <ProductCreateForm categories={categories} product={product} onCreated={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
