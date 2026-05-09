import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BarChart3, Package, ShoppingBag, Users } from "lucide-react";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import { formatPrice } from "@/lib/utils";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardStats = {
  users: number;
  posts: number;
  products: number;
  orders: number;
  revenue: number;
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard")}`);

  const isAdmin = user.role === "ADMIN";
  const canAccessDashboard = isAdmin || user.role === "VENDOR";
  if (!canAccessDashboard) redirect("/profile");

  const cookieStore = await cookies();
  const stats =
    (await fetchBackend<DashboardStats>("/api/v1/dashboard/stats", {
      headers: { cookie: cookieStore.toString() },
    })) ?? { users: 0, posts: 0, products: 0, orders: 0, revenue: 0 };
  const cards = [
    ...(isAdmin ? [{ label: "Users", value: stats.users.toLocaleString(), icon: Users }] : []),
    { label: "Posts", value: stats.posts.toLocaleString(), icon: BarChart3 },
    { label: "Products", value: stats.products.toLocaleString(), icon: Package },
    { label: "Orders", value: stats.orders.toLocaleString(), icon: ShoppingBag },
  ];

  return (
    <DashboardShell user={user} active="overview" title="Overview" subtitle="Simple workspace for your commerce operations.">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div />
            <div className="rounded border border-zinc-200 bg-white px-4 py-2 text-right">
              <p className="text-xs font-bold uppercase text-zinc-500">Revenue</p>
              <p className="text-xl font-black text-[#d62976]">{formatPrice(stats.revenue)}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.label} className="rounded border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-500">{card.label}</p>
                    <Icon className="size-4 text-zinc-400" />
                  </div>
                  <p className="mt-3 text-3xl font-black">{card.value}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded border border-zinc-200 bg-white">
              <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
                <h3 className="font-black">Recent Activity</h3>
                <button className="rounded border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600">Refresh</button>
              </div>
              <div className="grid min-h-80 place-items-center px-6 text-center">
                <div>
                  <p className="text-base font-black">No activity yet</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">Recent posts, products, and orders will appear here.</p>
                </div>
              </div>
            </section>

            <aside className="rounded border border-zinc-200 bg-white">
              <div className="h-12 border-b border-zinc-200 px-4 py-3">
                <h3 className="font-black">Account</h3>
              </div>
              <dl className="grid gap-4 p-4 text-sm">
                <div>
                  <dt className="font-bold text-zinc-500">Name</dt>
                  <dd className="mt-1 font-black">{user.name}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-500">Username</dt>
                  <dd className="mt-1 font-black">@{user.username}</dd>
                </div>
                <div>
                  <dt className="font-bold text-zinc-500">Role</dt>
                  <dd className="mt-1 inline-flex rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">{user.role}</dd>
                </div>
              </dl>
            </aside>
          </div>
    </DashboardShell>
  );
}
