"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { useAuthStore } from "@/store/use-auth-store";
import { useCartStore } from "@/store/use-cart-store";

export function AppProvider({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  const setUser = useAuthStore((state) => state.setUser);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    setUser(user);
    if (!user) clearCart();
  }, [clearCart, setUser, user]);

  return children;
}
