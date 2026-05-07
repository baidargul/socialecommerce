"use client";

import { CheckoutSheet } from "@/components/sheets/checkout-sheet";
import { CommentsSheet } from "@/components/sheets/comments-sheet";
import { ShareSheet } from "@/components/sheets/share-sheet";
import { useSheetStore } from "@/store/use-sheet-store";

export function SheetHost() {
  const activeSheet = useSheetStore((state) => state.activeSheet);

  return (
    <>
      <CommentsSheet open={activeSheet === "comments"} />
      <CheckoutSheet open={activeSheet === "checkout"} />
      <ShareSheet open={activeSheet === "share"} />
    </>
  );
}
