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
 * - satici (Seller): yalnız satış yaratma və müştəri yazma
 * sales.manage — satış düzəliş/sil + nisyə borc sətri silmə (OwnerOrManager)
 * customers.delete — müştəri silmə (OwnerOnly; borclu olsa belə)
 * Gün sonu (closings.write) və Ayarlar (settings.write) yalnız sahib-dədir
 *
 * BE#28 maaş icazələri (EmployeesEndpoints.cs ilə uyğun):
 * - salary.record — ödəniş/tutulma yazmaq (OwnerOrManager)
 * - salary.set — aylıq maaş təyini (OwnerOnly)
 * - salary.delete — maaş sətrini silmək (OwnerOnly)
 * Bütün maaş bölməsi satici üçün GİZLİDİR (öz maaşını da görmür) — səhifə
 * bunu ayrıca `user.role !== "satici"` yoxlaması ilə idarə edir, çünki
 * icazəsizlik "boş siyahı" deyil, bölmənin özünün görünməməsi deməkdir.
 */
const CAPABILITIES: Record<Role, string[]> = {
  sahib: ["*"],
  menecer: [
    "products.write",
    "suppliers.write",
    "expenses.write",
    "sales.write",
    "sales.manage",
    "customers.write",
    "salary.record",
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
