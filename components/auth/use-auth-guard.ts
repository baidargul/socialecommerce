"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";

function buildCurrentPath(pathname: string) {
  if (typeof window === "undefined") return pathname;
  return `${window.location.pathname}${window.location.search}`;
}

export function useAuthGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  function loginRedirect(nextPath = buildCurrentPath(pathname)) {
    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  function requireAuth(nextPath?: string) {
    if (user) return true;
    loginRedirect(nextPath);
    return false;
  }

  return {
    user,
    isAuthenticated: Boolean(user),
    requireAuth,
    loginRedirect,
  };
}
