"use client";

import { create } from "zustand";
import type { SessionUser } from "@/lib/auth/session";

type AuthState = {
  user: SessionUser | null;
  isHydrated: boolean;
  setUser: (user: SessionUser | null) => void;
  requireAuth: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isHydrated: false,
  setUser: (user) => set({ user, isHydrated: true }),
  requireAuth: () => Boolean(get().user),
}));
