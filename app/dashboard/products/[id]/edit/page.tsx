import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProductCreateForm } from "@/components/dashboard/product-create-form";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { CategoryItem, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard/products")}`);

  const canManageProducts = user.role === "ADMIN" || user.role === "VENDOR";
  if (!canManageProducts) redirect("/profile");

  const { id } = await params;
  const cookieStore = await cookies();
  const [productResponse, productsResponse, categoriesResponse] = await Promise.all([
    fetchBackend<Product>(`/api/v1/dashboard/products/${id}`, {
      headers: { cookie: cookieStore.toString() },
    }),
    fetchBackend<{ items: Product[]; nextCursor: null }>("/api/v1/dashboard/products", {
      headers: { cookie: cookieStore.toString() },
    }),
    fetchBackend<{ items: CategoryItem[]; nextCursor: null }>("/api/v1/dashboard/categories", {
      headers: { cookie: cookieStore.toString() },
    }),
  ]);

  const product = productResponse ?? productsResponse?.items.find((item) => item.id === id);
  if (!product) notFound();
  const categories = categoriesResponse?.items ?? [];

  return (
    <DashboardShell user={user} active="products" title="Edit Product" subtitle={product.name}>
      <div className="grid gap-4">
        <section className="rounded border border-zinc-200 bg-white p-5">
          <ProductCreateForm categories={categories} product={product} backHref="/dashboard/products" />
        </section>
      </div>
    </DashboardShell>
  );
}
