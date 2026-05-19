import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { OrderSummary } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard/orders")}`);
  if (user.role !== "ADMIN" && user.role !== "VENDOR") redirect("/profile");

  const cookieStore = await cookies();
  const response = await fetchBackend<{ items: OrderSummary[]; nextCursor: null }>("/api/v1/dashboard/orders", {
    headers: { cookie: cookieStore.toString() },
  });
  const orders = response?.items ?? [];

  return (
    <DashboardShell user={user} active="orders" title="Orders" subtitle="Manage customer orders, fulfillment state, and COD handoff.">
      <section className="rounded border border-zinc-200 bg-white">
        <div className="flex h-12 items-center justify-between border-b border-zinc-200 px-4">
          <h3 className="font-black">Order List</h3>
          <span className="text-sm font-bold text-zinc-500">{orders.length} orders</span>
        </div>

        {orders.length ? (
          <div className="divide-y divide-zinc-100">
            {orders.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`} className="grid gap-3 p-4 hover:bg-zinc-50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded bg-zinc-100">
                    <ClipboardList className="size-5" />
                  </div>
                  <div>
                    <p className="font-black">Order #{order.id.slice(-8)}</p>
                    <p className="text-sm font-bold text-zinc-500">{order.customerName} - {order.itemCount} items</p>
                  </div>
                </div>
                <span className="rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">{order.status}</span>
                <p className="text-right font-black text-[#1768d8]">{formatPrice(order.total)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid min-h-72 place-items-center px-6 text-center">
            <div>
              <ClipboardList className="mx-auto size-8 text-zinc-400" />
              <p className="mt-3 text-base font-black">No orders yet</p>
              <p className="mt-1 text-sm font-medium text-zinc-500">Orders will appear here after customers complete checkout.</p>
            </div>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
