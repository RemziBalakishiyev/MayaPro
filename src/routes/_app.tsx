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
  Menu,
  X,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/store";
import { useSettingsStore } from "@/features/settings/store";
import { useHydrateSettings } from "@/features/settings/queries";
import { useDashboardStats } from "@/features/reports/queries";
import { fmtMoney } from "@/lib/format";

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
  { to: "/", label: "Ana səhifə", icon: LayoutDashboard },
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

/** Aşağı tab bar üçün ən vacib 4 bənd (+ "Daha çox"). */
const TABS: NavItem[] = [
  { to: "/", label: "Ana səhifə", icon: LayoutDashboard },
  { to: "/satis", label: "Satış", icon: ShoppingCart },
  { to: "/mallar", label: "Mallar", icon: Package },
  { to: "/borclar", label: "Borclar", icon: Users },
];

function AppLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  useHydrateSettings();
  const { data: stats } = useDashboardStats();
  const lowStockCount = stats?.lowStock.length ?? 0;
  const storeName = useSettingsStore((s) => s.storeName);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = () => {
    navigate({ to: "/mallar", search: { q: search.trim() || undefined } });
  };

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const navLinks = (onNavigate?: () => void) =>
    NAV.map(({ to, label, icon: Icon }) => (
      <Link
        key={to}
        to={to}
        onClick={onNavigate}
        activeOptions={{ exact: to === "/" }}
        className="flex items-center gap-3 rounded-xl px-3 py-3.5 text-base font-medium text-emerald-100/80 transition hover:bg-emerald-900 hover:text-white"
        activeProps={{ className: "bg-emerald-800 text-white" }}
      >
        <Icon size={22} />
        <span className="flex-1">{label}</span>
        {to === "/mallar" && lowStockCount > 0 && (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
            {lowStockCount}
          </span>
        )}
      </Link>
    ));

  const sidebarInner = (onNavigate?: () => void) => (
    <>
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
          <Store size={22} className="text-emerald-300" />
        </div>
        <div>
          <p className="text-base font-bold leading-tight text-white">
            {storeName}
          </p>
          <p className="text-xs leading-tight text-emerald-300/70">
            Anbar İdarəetməsi
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navLinks(onNavigate)}
      </nav>

      <div className="border-t border-emerald-900 px-5 py-4">
        <p className="text-xs text-emerald-300/60">Kassada olmalı</p>
        <p className="text-2xl font-bold tabular-nums text-emerald-300">
          {fmtMoney(stats?.expectedCash ?? 0)}
        </p>
      </div>

      <div className="border-t border-emerald-900 px-3 py-3">
        <button
          onClick={handleLogout}
          className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-base font-medium text-emerald-100/80 transition hover:bg-emerald-900 hover:text-white"
        >
          <LogOut size={22} />
          <span>Çıxış</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-full bg-stone-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-emerald-950 lg:flex">
        {sidebarInner()}
      </aside>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-900/60"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-emerald-950 shadow-2xl">
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Bağla"
              className="absolute right-3 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-emerald-200 hover:bg-emerald-900"
            >
              <X size={22} />
            </button>
            {sidebarInner(() => setMenuOpen(false))}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-h-full flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-stone-200 bg-white px-4 lg:px-8">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Menyu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-stone-100 lg:hidden"
          >
            <Menu size={24} />
          </button>

          <h2 className="shrink-0 text-lg font-bold text-stone-800 lg:hidden">
            {storeName}
          </h2>

          <div className="relative hidden max-w-md flex-1 sm:block">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              placeholder="Mal axtar... (Enter)"
              className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 pl-11 pr-4 text-base outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {user && (
              <span className="flex h-10 items-center rounded-full bg-emerald-50 px-4 text-base font-semibold text-emerald-700">
                {user.name}
              </span>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="mx-auto w-full max-w-content flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobil aşağı tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-safe-bottom lg:hidden">
        <div className="grid grid-cols-5">
          {TABS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-stone-500"
              activeProps={{ className: "text-emerald-700" }}
            >
              <Icon size={24} />
              <span>{label}</span>
            </Link>
          ))}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-stone-500"
          >
            <MoreHorizontal size={24} />
            <span>Daha çox</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
