"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";
import { apiFetch } from "@/lib/api-url";
import { IconButton } from "@/components/ui/icon-button";
import { useAuthStore } from "@/store/use-auth-store";
import { cn } from "@/lib/utils";

export function ProductOptionsMenu({
  product,
  onDeleted,
  redirectAfterDelete = false,
  className,
}: {
  product: Product;
  onDeleted?: (productId: string) => void;
  redirectAfterDelete?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (user?.id !== product.vendorId) return null;

  async function deleteProduct() {
    if (deleting || !window.confirm("Delete this product permanently?")) return;
    setDeleting(true);
    setError("");
    try {
      const response = await apiFetch(`/api/v1/products/${product.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as {
        success: boolean;
        error: { message: string } | null;
      };
      if (!response.ok || !body.success) {
        setError(body.error?.message ?? "Product could not be deleted.");
        return;
      }
      setOpen(false);
      onDeleted?.(product.id);
      if (redirectAfterDelete)
        router.replace(`/profile/${product.vendorName}?tab=products`);
      else router.refresh();
    } catch {
      setError("Could not reach the product service.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <IconButton
        label="Product options"
        aria-expanded={open}
        aria-haspopup="menu"
        icon={<MoreHorizontal className="size-5" />}
        className="size-9 bg-white/95 shadow"
        onClick={() => {
          setError("");
          setOpen((current) => !current);
        }}
      />
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close product options"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-10 z-30 w-52 rounded-2xl border border-zinc-100 bg-white p-1.5 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              disabled={deleting}
              onClick={() => void deleteProduct()}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-red-600 active:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              {deleting ? "Deleting..." : "Delete product"}
            </button>
            {error ? (
              <p className="px-3 py-2 text-xs font-bold text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
