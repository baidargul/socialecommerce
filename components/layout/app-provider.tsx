"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth/session";
import { NativeAppBridge } from "@/components/layout/native-app-bridge";
import { useAuthStore } from "@/store/use-auth-store";
import { useCartStore } from "@/store/use-cart-store";

export function AppProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser | null;
}) {
  const setUser = useAuthStore((state) => state.setUser);
  const loadCart = useCartStore((state) => state.loadCart);
  const resetCart = useCartStore((state) => state.resetCart);

  useEffect(() => {
    setUser(user);
    if (user) void loadCart();
    else resetCart();
  }, [loadCart, resetCart, setUser, user]);

  return (
    <>
      <NativeAppBridge />
      {children}
    </>
  );
}
