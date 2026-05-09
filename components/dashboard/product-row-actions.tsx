"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

type ProductRowActionsProps = {
  product: Product;
};

export function ProductRowActions({ product }: ProductRowActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function deleteProduct() {
    setDeleting(true);
    const response = await fetch(`/api/v1/products/${product.id}`, { method: "DELETE" });
    setDeleting(false);

    if (response.ok) {
      setConfirmDelete(false);
      router.refresh();
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <button onClick={() => setConfirmDelete(true)} className="inline-flex size-8 items-center justify-center rounded border border-red-100 text-red-600">
        <Trash2 className="size-4" />
      </button>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 text-left shadow-xl">
            <h2 className="text-lg font-black text-zinc-950">Delete product?</h2>
            <p className="mt-2 text-sm font-medium text-zinc-500">{product.name} will be removed from products and timeline.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(false)} className="min-h-10 rounded border border-zinc-200 px-4 text-sm font-black text-zinc-700">
                Cancel
              </button>
              <button onClick={deleteProduct} disabled={deleting} className="min-h-10 rounded bg-red-600 px-4 text-sm font-black text-white disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
