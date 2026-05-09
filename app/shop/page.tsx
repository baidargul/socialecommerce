import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductGrid } from "@/components/product/product-grid";
import { fetchBackend } from "@/lib/backend-api";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const productsResponse = await fetchBackend<{ items: Product[]; nextCursor: null }>("/api/v1/products");

  return (
    <MobileShell>
      <ProductGrid products={productsResponse?.items ?? []} />
    </MobileShell>
  );
}
