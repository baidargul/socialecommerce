"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { Sheet } from "@/components/sheets/sheet";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";
import { useSheetStore } from "@/store/use-sheet-store";

export function CheckoutSheet({ open }: { open: boolean }) {
  const { requireAuth } = useAuthGuard();
  const product = useSheetStore((state) => state.selectedProduct);
  const closeSheet = useSheetStore((state) => state.closeSheet);
  const addProduct = useCartStore((state) => state.addProduct);
  const loading = useCartStore((state) => state.loading);

  if (!product) return null;
  const image = product.images[0];

  return (
    <Sheet open={open} onClose={closeSheet} className="min-h-[58dvh]">
      <h2 className="mb-8 text-4xl font-black">Checkout</h2>
      <div className="flex gap-6">
        <div className="relative size-36 overflow-hidden rounded-xl bg-zinc-100">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="144px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="pt-1">
          <h3 className="text-2xl font-black">{product.name}</h3>
          <p className="mt-3 text-3xl font-black text-[#1768d8]">
            {formatPrice(product.price)}
          </p>
          {product.originalPrice ? (
            <p className="text-xl font-medium text-zinc-500 line-through">
              {formatPrice(product.originalPrice)}
            </p>
          ) : null}
          {product.discountPercent ? (
            <p className="mt-1 text-xl font-black text-emerald-600">
              {product.discountPercent}% OFF
            </p>
          ) : null}
        </div>
      </div>

      <div className="my-8 h-px bg-zinc-200" />
      <h3 className="mb-4 text-2xl font-black">Order Summary</h3>
      <dl className="grid gap-4 text-2xl">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Subtotal</dt>
          <dd>{formatPrice(product.price)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-zinc-500">Shipping</dt>
          <dd>Free</dd>
        </div>
      </dl>
      <Button
        className="mt-10 w-full text-2xl"
        icon={<ShoppingBag className="size-6" />}
        disabled={product.status === "OUT_OF_STOCK" || loading}
        loading={loading}
        onClick={async () => {
          if (!requireAuth()) return;
          await addProduct(product);
          closeSheet();
        }}
      >
        {product.status === "OUT_OF_STOCK" ? "Out of Stock" : "Add to Cart"}
      </Button>
    </Sheet>
  );
}
