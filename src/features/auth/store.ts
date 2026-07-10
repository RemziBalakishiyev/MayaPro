import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    { name: "sederek-auth" },
  ),
);
