"use client";

import { create } from "zustand";
import type { CartLine, Product } from "@/lib/types";
import { apiFetch } from "@/lib/api-url";

type CartState = {
  items: CartLine[];
  loading: boolean;
  error: string;
  loadCart: () => Promise<void>;
  addProduct: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  resetCart: () => void;
  subtotal: () => number;
};

type CartResponse = {
  success: boolean;
  data: { items: CartLine[] } | null;
  error: { message: string } | null;
};

async function readCartResponse(response: Response): Promise<CartResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json"))
    return (await response.json()) as CartResponse;
  return {
    success: false,
    data: null,
    error: { message: "Cart service returned an invalid response." },
  };
}

async function syncCart(path: string, init?: RequestInit) {
  const response = await apiFetch(path, init);
  const body = await readCartResponse(response);
  if (!response.ok || !body.success || !body.data)
    throw new Error(body.error?.message ?? "Cart update failed.");
  return body.data.items;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: "",
  loadCart: async () => {
    set({ loading: true, error: "" });
    try {
      set({ items: await syncCart("/api/v1/cart"), loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Cart load failed.",
      });
    }
  },
  addProduct: async (product, quantity = 1) => {
    set({ loading: true, error: "" });
    try {
      set({
        items: await syncCart("/api/v1/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, quantity }),
        }),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Cart update failed.",
      });
    }
  },
  updateQuantity: async (productId, quantity) => {
    set({ loading: true, error: "" });
    try {
      set({
        items: await syncCart("/api/v1/cart/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        }),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Cart update failed.",
      });
    }
  },
  removeProduct: async (productId) => {
    set({ loading: true, error: "" });
    try {
      set({
        items: await syncCart("/api/v1/cart/remove", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        }),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Cart update failed.",
      });
    }
  },
  clearCart: async () => {
    set({ loading: true, error: "" });
    try {
      set({
        items: await syncCart("/api/v1/cart/clear", { method: "POST" }),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Cart update failed.",
      });
    }
  },
  resetCart: () => set({ items: [], error: "", loading: false }),
  subtotal: () =>
    get().items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
}));
