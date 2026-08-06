import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface AppShellProps {
  /** Sol menyu məzmunu — həm desktop `aside`, həm mobil drawer üçün. */
  sidebar: (opts: { isDrawer: boolean; close: () => void }) => ReactNode;
  /** Üst zolaq məzmunu (`TopHeader`). */
  header: ReactNode;
  /** Mobil aşağı tab bar (opsional). */
  tabBar?: ReactNode;
  /** Mobil menyunun açıq olub-olmaması — vəziyyət çağıran tərəfdədir. */
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  children: ReactNode;
}

/**
 * FE#69 — tətbiqin VAHİD karkası (AC-16).
 *
 * Sidebar eni (`w-sidebar` = 16rem), header hündürlüyü (`h-header` = 4rem) və
 * səhifə padding-i (`px-4 lg:px-8`) burada TƏK yerdə təyin olunur; bütün
 * route-lar eyni ölçüləri alır. Mobil davranış (drawer + alt tab bar +
 * `pb-safe-bottom`) mövcud olduğu kimi saxlanılıb.
 */
export function AppShell({
  sidebar,
  header,
  tabBar,
  menuOpen,
  onMenuOpenChange,
  children,
}: AppShellProps) {
  /* Mobil drawer açıqkən Escape ilə bağlansın (klaviatura naviqasiyası). */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onMenuOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen, onMenuOpenChange]);

  const close = () => onMenuOpenChange(false);

  return (
    <div className="min-h-full bg-stone-50">
      {/* Desktop sidebar — vahid en */}
      <aside className="fixed inset-y-0 left-0 hidden h-screen w-sidebar flex-col bg-emerald-950 lg:flex">
        {sidebar({ isDrawer: false, close })}
      </aside>

      {/* Mobil menyu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-stone-900/60"
            onClick={close}
          />
          {/* h-full (h-screen deyil): mobil brauzer panelləri 100vh-i görünən
              sahədən böyük etdikdə alt blok kəsilməsin. */}
          <div
            role="dialog"
            aria-label="Menyu"
            className="absolute inset-y-0 left-0 flex h-full w-72 max-w-[85%] flex-col bg-emerald-950 shadow-panel"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Bağla"
              title="Bağla"
              className="focus-ring-dark absolute right-3 top-2 flex h-11 w-11 items-center justify-center rounded-control text-emerald-200 hover:bg-emerald-900"
            >
              <X size={22} />
            </button>
            {sidebar({ isDrawer: true, close })}
          </div>
        </div>
      )}

      {/* Əsas sütun */}
      <div className={cn("flex min-h-full flex-col lg:pl-sidebar")}>
        {header}
        {/*
         * Səhifə padding-i BÜTÜN route-larda eynidir (AC-16).
         * `pb-28` mobil tab bar-ın altında kontent qalmasın deyə saxlanılıb.
         */}
        <main className="w-full flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      {tabBar}
    </div>
  );
}
