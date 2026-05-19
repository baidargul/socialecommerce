"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";
import { useCartStore } from "@/store/use-cart-store";

export function LogoutButton() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const resetCart = useCartStore((state) => state.resetCart);

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    resetCart();
    router.push("/");
    router.refresh();
  }

  return (
    <Button intent="secondary" className="w-full" onClick={logout}>
      Logout
    </Button>
  );
}
