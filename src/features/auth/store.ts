import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { Role } from "@/types";

/** Auth persist state-inin saxlandığı açar (həm `persist`, həm aşağıdakı təmizləmə üçün TƏK mənbə). */
const AUTH_STORAGE_KEY = "sederek-auth";

/**
 * FE#187 — "Hesabı yadda saxla" checkbox-ının vəziyyəti bu açarda saxlanılır
 * (auth state-in özündən AYRI, HƏMİŞƏ localStorage-da) — çünki səhifə açılışında
 * `persist` middleware-i hansı yaddaşdan (localStorage/sessionStorage) oxuyacağını
 * auth state-in özü yüklənməzdən ƏVVƏL bilməlidir.
 *
 * - "1" (və ya açar yoxdursa, defolt) → localStorage: tab/brauzer bağlanandan sonra
 *   da sessiya qalır (BE#45: rememberMe=true → 30 günlük token).
 * - "0" → sessionStorage: brauzer tam bağlananda sessiya silinir.
 */
const REMEMBER_FLAG_KEY = "sederek-auth-remember";

function readRememberFlag(): boolean {
  try {
    const v = localStorage.getItem(REMEMBER_FLAG_KEY);
    return v === null ? true : v === "1";
  } catch {
    // localStorage əlçatan deyil (məs. gizli rejim/SSR) — defolt davranış.
    return true;
  }
}

/**
 * Login formu checkbox dəyişəndə (submit-dən əvvəl) çağırır: sonrakı
 * `login()` çağırışının hansı yaddaşa yazılacağını təyin edir. Digər
 * yaddaşdakı köhnə iz (əvvəlki sessiyadan miras) dərhal silinir ki, iki
 * yaddaşda eyni anda köhnəlmiş/təzə auth state qarışığı qalmasın.
 */
export function setRememberMe(remember: boolean): void {
  try {
    localStorage.setItem(REMEMBER_FLAG_KEY, remember ? "1" : "0");
    (remember ? sessionStorage : localStorage).removeItem(AUTH_STORAGE_KEY);
  } catch {
    // yaddaş əlçatan deyil — sükutla keç, defolt (localStorage) davranış davam edir.
  }
}

/**
 * `rememberMe` seçiminə görə runtime-da localStorage/sessionStorage arasında
 * keçid edən storage adapteri. `zustand/persist` hər state dəyişikliyində
 * `setItem` çağırır — checkbox vəziyyəti hər dəfə `readRememberFlag()` ilə
 * yenidən oxunur, ona görə seçim login zamanı dərhal effektiv olur.
 */
const dynamicAuthStorage: StateStorage = {
  getItem: (name) => {
    try {
      return (readRememberFlag() ? localStorage : sessionStorage).getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const remember = readRememberFlag();
      const active = remember ? localStorage : sessionStorage;
      const inactive = remember ? sessionStorage : localStorage;
      active.setItem(name, value);
      inactive.removeItem(name);
    } catch {
      // yaddaş əlçatan deyil — sükutla keç.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
    } catch {
      // yaddaş əlçatan deyil — sükutla keç.
    }
  },
};

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
  // FE#183 — platforma admini heç bir mağaza icazəsinə sahib deyil: onun
  // səlahiyyəti `/admin` bölməsindədir (route guard-ı ilə), bu cədvəldə yox.
  platform_admin: [],
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
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => dynamicAuthStorage),
    },
  ),
);

/** Komponentlərdə rahat istifadə üçün selektor hook. */
export const useCan = (): ((permission: string) => boolean) =>
  useAuthStore((s) => s.can);
