"use client";

import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/use-cart-store";

export function ProductDetailActions({ product }: { product: Product }) {
  const { requireAuth } = useAuthGuard();
  const addProduct = useCartStore((state) => state.addProduct);

  return (
    <Button
      className="mt-8 w-full text-lg"
      icon={<ShoppingBag className="size-5" />}
      disabled={product.status === "OUT_OF_STOCK"}
      onClick={() => {
        if (!requireAuth(`/product/${product.slug}`)) return;
        addProduct(product);
      }}
    >
      {product.status === "OUT_OF_STOCK" ? "Out of Stock" : "Add to Cart"}
    </Button>
  );
}
