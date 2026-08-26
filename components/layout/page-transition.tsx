"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.main
          key={pathname}
          className={className}
          initial={
            reduceMotion ? { opacity: 1 } : { opacity: 0, y: 7, scale: 0.996 }
          }
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={
            reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4, scale: 0.998 }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
          }
          style={{ willChange: reduceMotion ? "auto" : "opacity, transform" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
