import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderTree, PackagePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductCreateDialog } from "@/components/dashboard/product-create-dialog";
import { ProductTable } from "@/components/dashboard/product-table";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { CategoryItem, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardProductsPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard/products")}`);

  const canManageProducts = user.role === "ADMIN" || user.role === "VENDOR";
  if (!canManageProducts) redirect("/profile");

  const cookieStore = await cookies();
  const [productsResponse, categoriesResponse] = await Promise.all([
    fetchBackend<{ items: Product[]; nextCursor: null }>("/api/v1/dashboard/products", {
      headers: { cookie: cookieStore.toString() },
    }),
    fetchBackend<{ items: CategoryItem[]; nextCursor: null }>("/api/v1/dashboard/categories", {
      headers: { cookie: cookieStore.toString() },
    }),
  ]);
  const products = productsResponse?.items ?? [];
  const categories = categoriesResponse?.items ?? [];

  return (
    <DashboardShell user={user} active="products" title="Products" subtitle="Manage product catalog, inventory, pricing, and product options.">
        <section className="rounded border border-zinc-200 bg-white">
          <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
            <h3 className="font-black">Product List</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-zinc-500">{products.length} items</span>
              <Link href="/dashboard/products/categories" className="inline-flex min-h-10 items-center gap-2 rounded border border-zinc-200 bg-white px-4 text-sm font-black text-zinc-800">
                <FolderTree className="size-4" />
                Categories
              </Link>
              <ProductCreateDialog categories={categories} />
            </div>
          </div>

          {products.length ? (
            <ProductTable products={products} categories={categories} />
          ) : (
            <div className="grid min-h-72 place-items-center px-6 text-center">
              <div>
                <PackagePlus className="mx-auto size-8 text-zinc-400" />
                <p className="mt-3 text-base font-black">No products yet</p>
                <p className="mt-1 text-sm font-medium text-zinc-500">Use the Add Product button to create your first catalog item.</p>
              </div>
            </div>
          )}
        </section>
    </DashboardShell>
  );
}
