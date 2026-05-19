import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { OrderStatusForm } from "@/components/dashboard/order-status-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { OrderDetail } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardOrderDetailPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/dashboard/orders")}`);
  if (user.role !== "ADMIN" && user.role !== "VENDOR") redirect("/profile");

  const { id } = await params;
  const cookieStore = await cookies();
  const order = await fetchBackend<OrderDetail>(`/api/v1/dashboard/orders/${id}`, {
    headers: { cookie: cookieStore.toString() },
  });
  if (!order) notFound();

  return (
    <DashboardShell user={user} active="orders" title={`Order #${order.id.slice(-8)}`} subtitle={`${order.itemCount} items - ${order.paymentMethod}`}>
      <div className="grid gap-5">
        <OrderStatusForm orderId={order.id} status={order.status} />

        <section className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4">
            <div>
              <h3 className="font-black">Customer</h3>
              <p className="mt-1 text-sm font-bold text-zinc-700">{order.customerName}</p>
              {order.customerEmail ? <p className="text-sm font-medium text-zinc-500">{order.customerEmail}</p> : null}
            </div>
            <div className="text-right">
              <p className="rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">{order.status}</p>
              <p className="mt-2 text-sm font-bold text-zinc-500">Payment: {order.paymentStatus}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-4 rounded bg-zinc-50 p-3 text-sm">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="font-bold text-zinc-500">{item.quantity} x {formatPrice(item.price)}</p>
                </div>
                <p className="font-black">{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 ml-auto grid max-w-sm gap-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-zinc-500">Subtotal</span>
              <span className="font-black">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-zinc-500">Shipping</span>
              <span className="font-black">{formatPrice(order.shippingAmount)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-black">Total</span>
              <span className="font-black text-[#1768d8]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        <section className="rounded border border-zinc-200 bg-white p-4">
          <h3 className="font-black">Shipping Address</h3>
          <p className="mt-2 text-sm font-bold text-zinc-700">{order.shippingAddress.fullName}</p>
          <p className="text-sm font-medium text-zinc-500">{order.shippingAddress.phone}</p>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            {order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.country}
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
