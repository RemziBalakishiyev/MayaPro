import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/types";

export interface AuthUser {
  id: string;
  name: string;
  phone?: string;
  role: Role;
}

/**
 * Rol icazələri (backend policy-ləri ilə uyğun):
 * - sahib (Owner): hər şey
 * - menecer (Manager): satış, mal, borc, təchizatçı, xərc (OwnerOrManager)
 * - satici (Seller): yalnız satış və müştəri
 * Gün sonu (closings.write) və Ayarlar (settings.write) yalnız sahib-dədir
 * (backend OwnerOnly).
 */
const CAPABILITIES: Record<Role, string[]> = {
  sahib: ["*"],
  menecer: [
    "products.write",
    "suppliers.write",
    "expenses.write",
    "sales.write",
    "customers.write",
  ],
  satici: ["sales.write", "customers.write"],
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  /** İstifadəçinin verilmiş icazəsi varmı. */
  can: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      can: (permission) => {
        const user = get().user;
        if (!user) return false;
        const caps = CAPABILITIES[user.role] ?? [];
        return caps.includes("*") || caps.includes(permission);
      },
    }),
    { name: "sederek-auth" },
  ),
);

/** Komponentlərdə rahat istifadə üçün selektor hook. */
export const useCan = (): ((permission: string) => boolean) =>
  useAuthStore((s) => s.can);
