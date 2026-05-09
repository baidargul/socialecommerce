"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

export function ProductCard({ product }: { product: Product }) {
  const { requireAuth } = useAuthGuard();
  const addProduct = useCartStore((state) => state.addProduct);
  const image = product.images[0];

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-100 bg-white">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square bg-zinc-100">
        {image ? <Image src={image} alt={product.name} fill sizes="180px" className="object-cover" /> : null}
        {product.discountPercent ? (
          <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-xs font-black text-white">
            {product.discountPercent}% OFF
          </span>
        ) : null}
      </Link>
      <div className="p-3">
        <p className="text-xs font-bold uppercase text-zinc-500">{product.category}</p>
        <h2 className="mt-1 line-clamp-2 min-h-10 text-base font-black">{product.name}</h2>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-lg font-black text-[#1768d8]">{formatPrice(product.price)}</p>
          {product.originalPrice ? <p className="text-sm font-medium text-zinc-400 line-through">{formatPrice(product.originalPrice)}</p> : null}
        </div>
        <Button
          className="mt-3 min-h-10 w-full px-3"
          icon={<ShoppingBag className="size-4" />}
          disabled={product.status === "OUT_OF_STOCK"}
          onClick={() => {
            if (!requireAuth()) return;
            addProduct(product);
          }}
        >
          {product.status === "OUT_OF_STOCK" ? "Sold Out" : "Add"}
        </Button>
      </div>
    </article>
  );
}
