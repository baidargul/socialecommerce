import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MobileShell } from "@/components/layout/mobile-shell";
import { getSessionUser } from "@/lib/auth/session";
import { fetchBackend } from "@/lib/backend-api";
import type { OrderDetail } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent("/orders")}`);
  const { id } = await params;
  const cookieStore = await cookies();
  const order = await fetchBackend<OrderDetail>(`/api/v1/orders/${id}`, {
    headers: { cookie: cookieStore.toString() },
  });
  if (!order) notFound();

  return (
    <MobileShell>
      <div className="px-5 py-6">
        <h1 className="text-3xl font-black">Order #{order.id.slice(-8)}</h1>
        <p className="mt-2 inline-flex rounded bg-[#fff1f7] px-2 py-1 text-xs font-black text-[#d62976]">{order.status}</p>
        <section className="mt-6 rounded-lg bg-zinc-50 p-5">
          <h2 className="text-xl font-black">Items</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-4 text-sm">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="font-bold text-zinc-500">{item.quantity} x {formatPrice(item.price)}</p>
                </div>
                <p className="font-black">{formatPrice(item.total)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-zinc-200 pt-4 text-lg font-black">
            <div className="flex justify-between"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </section>
        <section className="mt-5 rounded-lg border border-zinc-100 p-5">
          <h2 className="text-xl font-black">Shipping</h2>
          <p className="mt-2 text-sm font-bold text-zinc-600">{order.shippingAddress.fullName}</p>
          <p className="text-sm font-medium text-zinc-500">{order.shippingAddress.phone}</p>
          <p className="mt-2 text-sm font-medium text-zinc-500">{order.shippingAddress.addressLine}, {order.shippingAddress.city}, {order.shippingAddress.country}</p>
        </section>
      </div>
    </MobileShell>
  );
}
