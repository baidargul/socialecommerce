"use client";

import { create } from "zustand";
import type { Product } from "@/lib/types";

type ProductState = {
  products: Product[];
  query: string;
  category: string;
  setProducts: (products: Product[]) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
};

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  query: "",
  category: "All",
  setProducts: (products) => set({ products }),
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
}));
