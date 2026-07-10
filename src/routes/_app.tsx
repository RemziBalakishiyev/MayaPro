import {
  createFileRoute,
  redirect,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  Lock,
  BarChart3,
  UserCog,
  Settings,
  Store,
  LogOut,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useSettingsStore } from "@/features/settings/store";
import { useDashboardStats } from "@/features/reports/queries";
import { fmtDate, fmtMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    if (!useAuthStore.getState().user) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mallar", label: "Mallar", icon: Package },
  { to: "/satis", label: "Satış", icon: ShoppingCart },
  { to: "/borclar", label: "Nisyə Borclar", icon: Users },
  { to: "/tedarukculer", label: "Təchizatçılar", icon: Truck },
  { to: "/xercler", label: "Xərclər", icon: Receipt },
  { to: "/gun-sonu", label: "Gün Sonu", icon: Lock },
  { to: "/hesabatlar", label: "Hesabatlar", icon: BarChart3 },
  { to: "/iscilar", label: "İşçilər", icon: UserCog },
  { to: "/ayarlar", label: "Ayarlar", icon: Settings },
];

function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: stats } = useDashboardStats();
  const lowStockCount = stats?.lowStock.length ?? 0;
  const storeName = useSettingsStore((s) => s.storeName);
  const [search, setSearch] = useState("");

  const submitSearch = () => {
    navigate({ to: "/mallar", search: { q: search.trim() || undefined } });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex min-h-full bg-stone-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col bg-emerald-950">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
            <Store size={18} className="text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight text-white">
              Sədərək Sistem
            </p>
            <p className="text-[11px] leading-tight text-emerald-300/70">
              Anbar İdarəetməsi
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/80 transition hover:bg-emerald-900 hover:text-white"
              activeProps={{
                className: "bg-emerald-800 text-white",
              }}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {to === "/mallar" && lowStockCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {lowStockCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="border-t border-emerald-900 px-4 py-3">
          <p className="text-[11px] text-emerald-300/60">Kassada olmalı</p>
          <p className="text-lg font-bold tabular-nums text-emerald-300">
            {fmtMoney(stats?.expectedCash ?? 0)}
          </p>
        </div>

        <div className="border-t border-emerald-900 px-3 py-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-100/80 transition hover:bg-emerald-900 hover:text-white"
          >
            <LogOut size={18} />
            <span>Çıxış</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-full flex-1 flex-col pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-stone-200 bg-white px-6">
          <h2 className="shrink-0 text-base font-semibold text-stone-800">
            {storeName}
          </h2>
          <div className="relative max-w-xs flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Mal axtar... (Enter)"
              className="w-full rounded-lg border border-stone-300 bg-stone-50 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden text-sm text-stone-500 sm:inline">
              {fmtDate(new Date())}
            </span>
            {user && (
              <span
                className={cn(
                  "rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700",
                )}
              >
                {user.name}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
