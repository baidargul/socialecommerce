"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function Sheet({ open, onClose, children, className }: SheetProps) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    history.pushState({ sheet: true }, "");

    const closeOnBack = () => onClose();
    window.addEventListener("popstate", closeOnBack);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("popstate", closeOnBack);
    };
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 mx-auto max-w-[430px]">
          <motion.button
            aria-label="Close sheet"
            type="button"
            className="absolute inset-0 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            className={cn("absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4 shadow-2xl", className)}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) onClose();
            }}
          >
            <div className="mx-auto mb-8 h-1.5 w-14 rounded-full bg-zinc-300" />
            {children}
          </motion.section>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
