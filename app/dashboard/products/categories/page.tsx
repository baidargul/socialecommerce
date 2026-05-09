import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/dashboard/category-manager";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { fetchBackend } from "@/lib/backend-api";
import { getSessionUser } from "@/lib/auth/session";
import type { CategoryItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardProductCategoriesPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard/products/categories")}`);

  const canManageProducts = user.role === "ADMIN" || user.role === "VENDOR";
  if (!canManageProducts) redirect("/profile");

  const cookieStore = await cookies();
  const categoriesResponse = await fetchBackend<{ items: CategoryItem[]; nextCursor: null }>("/api/v1/dashboard/categories", {
    headers: { cookie: cookieStore.toString() },
  });

  return (
    <DashboardShell user={user} active="products" title="Categories" subtitle="Create and organize nested product categories for your catalog.">
      <CategoryManager initialCategories={categoriesResponse?.items ?? []} />
    </DashboardShell>
  );
}
