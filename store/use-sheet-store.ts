"use client";

import { create } from "zustand";
import type { FeedPost, Product } from "@/lib/types";

export type SheetName = "comments" | "checkout" | "share" | null;

type SheetState = {
  activeSheet: SheetName;
  selectedPost: FeedPost | null;
  selectedProduct: Product | null;
  openComments: (post: FeedPost) => void;
  openCheckout: (product: Product, post?: FeedPost) => void;
  openShare: (post: FeedPost) => void;
  closeSheet: () => void;
};

export const useSheetStore = create<SheetState>((set) => ({
  activeSheet: null,
  selectedPost: null,
  selectedProduct: null,
  openComments: (post) =>
    set({
      activeSheet: "comments",
      selectedPost: post,
      selectedProduct: post.product ?? null,
    }),
  openCheckout: (product, post) =>
    set({
      activeSheet: "checkout",
      selectedProduct: product,
      selectedPost: post ?? null,
    }),
  openShare: (post) =>
    set({
      activeSheet: "share",
      selectedPost: post,
      selectedProduct: post.product ?? null,
    }),
  closeSheet: () => set({ activeSheet: null }),
}));
