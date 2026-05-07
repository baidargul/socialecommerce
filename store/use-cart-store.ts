"use client";

import { create } from "zustand";
import type { CartLine, Product } from "@/lib/types";

type CartState = {
  items: CartLine[];
  addProduct: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
  subtotal: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addProduct: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
              : item,
          ),
        };
      }

      return { items: [...state.items, { product, quantity }] };
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item,
      ),
    })),
  removeProduct: (productId) =>
    set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),
  clearCart: () => set({ items: [] }),
  subtotal: () => get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
}));
