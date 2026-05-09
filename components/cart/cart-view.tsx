"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { AuthRequired } from "@/components/auth/auth-required";
import { useAuthGuard } from "@/components/auth/use-auth-guard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/use-cart-store";

export function CartView() {
  const { isAuthenticated, requireAuth } = useAuthGuard();
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeProduct = useCartStore((state) => state.removeProduct);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.subtotal());

  if (!isAuthenticated) {
    return <AuthRequired title="Login to view cart" message="Your cart, checkout, and order flow are tied to your account session." nextPath="/cart" />;
  }

  if (!items.length) {
    return (
      <div className="px-5 py-6">
        <h1 className="text-4xl font-black">Cart</h1>
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
          onClick={() => {
            if (!requireAuth("/cart")) return;
            clearCart();
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
                  updateQuantity(item.product.id, item.quantity - 1);
                }} />
                <span className="w-8 text-center font-black">{item.quantity}</span>
                <IconButton label="Increase quantity" icon={<Plus className="size-4" />} className="size-8 bg-zinc-100" onClick={() => {
                  if (!requireAuth("/cart")) return;
                  updateQuantity(item.product.id, item.quantity + 1);
                }} />
                <IconButton label="Remove product" icon={<Trash2 className="size-4" />} className="ml-auto size-8 text-red-600" onClick={() => {
                  if (!requireAuth("/cart")) return;
                  removeProduct(item.product.id);
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
        <Button className="mt-6 w-full text-lg" onClick={() => requireAuth("/cart")}>Checkout</Button>
      </section>
    </div>
  );
}
