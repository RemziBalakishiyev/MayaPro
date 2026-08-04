import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Store, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SidebarNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Sağda göstərilən say nişanı (məs. azalan mal sayı). */
  badge?: number;
  /** Nişanın nə demək olduğunu izah edən tooltip (rəng tək siqnal olmasın). */
  badgeTitle?: string;
}

export interface SidebarProps {
  /** Mağaza adı — brend bloku. */
  storeName: string;
  /** Brend blokunun alt yazısı. */
  storeSubtitle?: string;
  items: SidebarNavItem[];
  /** Menyunun altındakı sabit blok (məs. kassa göstəricisi + Çıxış). */
  footer?: ReactNode;
  /** Mobil drawer rejimi — başlıq bağlama düyməsi ilə üst-üstə düşməsin. */
  isDrawer?: boolean;
  /** Bənd seçildikdə (mobil drawer bağlanması üçün). */
  onNavigate?: () => void;
}

/**
 * FE#69 — paylaşılan sol menyu (AppShell daxilində istifadə olunur).
 * Naviqasiya siyahısı, brend bloku və alt blok slot kimi ötürülür; ölçülər
 * (44px bənd hündürlüyü, `focus-ring-dark` fokus halqası) burada sabitdir.
 */
export function Sidebar({
  storeName,
  storeSubtitle = "Anbar İdarəetməsi",
  items,
  footer,
  isDrawer = false,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          "flex flex-shrink-0 items-center gap-3 px-4 py-2",
          // drawer-də sağ yuxarıdakı "Bağla" düyməsi mətnin üstünə düşməsin
          isDrawer && "pr-16",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-emerald-500/20 ring-1 ring-emerald-400/40">
          <Store size={22} className="text-emerald-300" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold leading-tight text-white">
            {storeName}
          </p>
          <p className="truncate text-xs leading-tight text-emerald-300/70">
            {storeSubtitle}
          </p>
        </div>
      </div>

      <nav
        aria-label="Əsas menyu"
        className="sidebar-scroll min-h-0 flex-1 space-y-px overflow-y-auto px-3 py-1"
      >
        {items.map(({ to, label, icon: Icon, badge, badgeTitle }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: to === "/" }}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-control px-3 py-2",
              "text-base font-medium text-emerald-100/80 transition",
              "hover:bg-emerald-900 hover:text-white",
              "focus-ring-dark",
            )}
            activeProps={{ className: "bg-emerald-800 text-white" }}
          >
            <Icon size={22} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span
                title={badgeTitle}
                className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold leading-none tabular-nums text-white"
              >
                {badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {footer && (
        <div className="flex-shrink-0 space-y-0.5 border-t border-emerald-900 px-3 py-1.5">
          {footer}
        </div>
      )}
    </>
  );
}
