import { MobileShell } from "@/components/layout/mobile-shell";
import { ProductGrid } from "@/components/product/product-grid";
import { demoProducts } from "@/lib/demo-data";

export default function ShopPage() {
  return (
    <MobileShell>
      <ProductGrid products={demoProducts} />
    </MobileShell>
  );
}
