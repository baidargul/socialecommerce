import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { MobileShell } from "@/components/layout/mobile-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { OrderSummary } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/orders")}`);

  const cookieStore = await cookies();
  const response = await fetchBackend<{ items: OrderSummary[]; nextCursor: null }>("/api/v1/orders", {
    headers: { cookie: cookieStore.toString() },
  });
  const orders = response?.items ?? [];

  return (
    <MobileShell>
      <div className="px-5 py-6">
        <h1 className="text-4xl font-black">Orders</h1>
        {orders.length ? (
          <div className="mt-6 grid gap-3">
            {orders.map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-4">
                <div className="grid size-11 place-items-center rounded-full bg-zinc-100">
                  <Package className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black">Order #{order.id.slice(-8)}</p>
                  <p className="text-sm font-bold text-zinc-500">{order.itemCount} items - {order.status}</p>
                </div>
                <p className="font-black text-[#1768d8]">{formatPrice(order.total)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="No orders yet">Your completed checkouts will appear here.</EmptyState>
        )}
      </div>
    </MobileShell>
  );
}
