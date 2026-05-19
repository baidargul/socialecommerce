"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { TextInput } from "@/components/ui/input";
import type { OrderDetail } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

type OrderResponse = {
  success: boolean;
  data: OrderDetail | null;
  error: { message: string } | null;
};

export function CartView() {
  const { isAuthenticated, requireAuth } = useAuthGuard();
  const items = useCartStore((state) => state.items);
  const loading = useCartStore((state) => state.loading);
  const error = useCartStore((state) => state.error);
  const loadCart = useCartStore((state) => state.loadCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.subtotal());
  const [showCheckout, setShowCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

  function updateAddress(field: keyof typeof shippingAddress, value: string) {
    setShippingAddress((current) => ({ ...current, [field]: value }));
  }

  async function placeOrder() {
    if (!requireAuth("/cart")) return;
    setPlacingOrder(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "COD", shippingAddress }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json") ? ((await response.json()) as OrderResponse) : null;
      if (!response.ok || !body?.success || !body.data) {
        setCheckoutError(body?.error?.message ?? "Could not place order.");
        await loadCart();
        return;
      }

      setOrder(body.data);
      setShowCheckout(false);
      await loadCart();
    } catch {
      setCheckoutError("Could not reach the order service.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (!isAuthenticated) {
    return <AuthRequired title="Login to view cart" message="Your cart, checkout, and order flow are tied to your account session." nextPath="/cart" />;
  }

  if (!items.length) {
    return (
      <div className="px-5 py-6">
        <h1 className="text-4xl font-black">Cart</h1>
        {order ? (
          <section className="mt-6 rounded-lg bg-emerald-50 p-5">
            <h2 className="text-2xl font-black text-emerald-800">Order placed</h2>
            <p className="mt-2 text-sm font-bold text-emerald-700">Order #{order.id.slice(-8)} is now pending confirmation.</p>
            <Link href={`/orders/${order.id}`} className="mt-4 inline-flex min-h-10 items-center rounded-full bg-emerald-700 px-4 text-sm font-black text-white">
              View Order
            </Link>
          </section>
        ) : null}
        <EmptyState title="Your cart is empty">Add products from the feed or shop.</EmptyState>
      </div>
    );
  }

  return (
    <div className="px-5 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black">Cart</h1>
        <Button
          intent="ghost"
          loading={loading}
          onClick={async () => {
            if (!requireAuth("/cart")) return;
            await clearCart();
          }}
        >
          Clear
        </Button>
      </div>
      <div className="mt-6 grid gap-4">
        {items.map((item) => (
          <article key={item.product.id} className="flex gap-4 rounded-lg border border-zinc-100 p-3">
            <div className="relative size-24 overflow-hidden rounded-lg bg-zinc-100">
              {item.product.images[0] ? <Image src={item.product.images[0]} alt={item.product.name} fill sizes="96px" className="object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-black">{item.product.name}</h2>
              <p className="font-black text-[#1768d8]">{formatPrice(item.product.price)}</p>
              <div className="mt-3 flex items-center gap-2">
                <IconButton label="Decrease quantity" icon={<Minus className="size-4" />} className="size-8 bg-zinc-100" onClick={() => {
                  if (!requireAuth("/cart")) return;
                  void updateQuantity(item.product.id, item.quantity - 1);
                }} />
                <span className="w-8 text-center font-black">{item.quantity}</span>
                <IconButton label="Increase quantity" icon={<Plus className="size-4" />} className="size-8 bg-zinc-100" onClick={() => {
                  if (!requireAuth("/cart")) return;
                  void updateQuantity(item.product.id, item.quantity + 1);
                }} />
                <IconButton label="Remove product" icon={<Trash2 className="size-4" />} className="ml-auto size-8 text-red-600" onClick={() => {
                  if (!requireAuth("/cart")) return;
                  void removeProduct(item.product.id);
                }} />
              </div>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-8 rounded-lg bg-zinc-50 p-5">
        <h2 className="text-2xl font-black">Summary</h2>
        <div className="mt-4 grid gap-3 text-lg">
          <div className="flex justify-between">
            <span className="text-zinc-500">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between text-2xl font-black">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </div>
        {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
        <Button className="mt-6 w-full text-lg" onClick={() => {
          if (!requireAuth("/cart")) return;
          setShowCheckout((current) => !current);
        }}>Checkout</Button>
      </section>

      {showCheckout ? (
        <section className="mt-5 rounded-lg border border-zinc-100 bg-white p-5">
          <h2 className="text-2xl font-black">Shipping</h2>
          <p className="mt-1 text-sm font-bold text-zinc-500">Payment method: Cash on delivery</p>
          <div className="mt-5 grid gap-4">
            <TextInput label="Full name" value={shippingAddress.fullName} onChange={(event) => updateAddress("fullName", event.target.value)} />
            <TextInput label="Phone" value={shippingAddress.phone} onChange={(event) => updateAddress("phone", event.target.value)} />
            <TextInput label="Address" value={shippingAddress.addressLine} onChange={(event) => updateAddress("addressLine", event.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="City" value={shippingAddress.city} onChange={(event) => updateAddress("city", event.target.value)} />
              <TextInput label="State" value={shippingAddress.state} onChange={(event) => updateAddress("state", event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="Country" value={shippingAddress.country} onChange={(event) => updateAddress("country", event.target.value)} />
              <TextInput label="Postal code" value={shippingAddress.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} />
            </div>
          </div>
          {checkoutError ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{checkoutError}</p> : null}
          <Button className="mt-5 w-full text-lg" loading={placingOrder} onClick={placeOrder}>Place COD Order</Button>
        </section>
      ) : null}
    </div>
  );
}
