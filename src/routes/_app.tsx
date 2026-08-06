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
  HandCoins,
  Truck,
  Receipt,
  Lock,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { GlobalProductSearch } from "@/components/layout/GlobalProductSearch";
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
  { to: "/musteriler", label: "Müştərilər", icon: Users },
  { to: "/borclar", label: "Nisyə Borclar", icon: HandCoins },
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

  const navItems: SidebarNavItem[] = NAV.map((item) => ({
    ...item,
    badge: item.to === "/mallar" ? lowStockCount : undefined,
    badgeTitle:
      item.to === "/mallar" ? `${lowStockCount} mal azalır` : undefined,
  }));

  const sidebarFooter = (
    <>
      <div className="px-3">
        {/*
          FE#77 (R-01 / E-01): bu rəqəm son bağlanışın faktikindən bəri
          YIĞILAN ÜMUMİ kassa gözləntisidir (`DashboardCalculator.ExpectedCash`
          — bax backend `docs/flows/DAYEND-FLOW.md`), Gün Sonu səhifəsindəki
          "Bu günün sonunda kassada olmalı" isə YALNIZ bugünkü hesabdır.
          Əhatə fərqli olduğu üçün etiketlər fərqləndirilir — hesablama
          düsturuna TOXUNULMUR (`useDashboardStats()` olduğu kimi qalır).
        */}
        <p className="text-xs leading-tight text-emerald-300/60">
          Kassada olmalı (ümumi)
        </p>
        <p
          title={fmtMoney(stats?.expectedCash ?? 0)}
          className="money mt-0.5 text-xl font-bold leading-tight text-emerald-300"
        >
          {fmtMoney(stats?.expectedCash ?? 0)}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight text-emerald-300/50">
          Son bağlanışdan bəri
        </p>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="focus-ring-dark flex min-h-[44px] w-full items-center gap-3 rounded-control px-3 text-base font-medium text-emerald-100/80 transition hover:bg-emerald-900 hover:text-white"
      >
        <LogOut size={22} className="shrink-0" />
        <span>Çıxış</span>
      </button>
    </>
  );

  const tabBar = (
    <nav
      aria-label="Sürətli naviqasiya"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-safe-bottom lg:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="focus-ring-inset flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-stone-500"
            activeProps={{ className: "text-emerald-700" }}
          >
            <Icon size={24} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="focus-ring-inset flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-stone-500"
        >
          <MoreHorizontal size={24} />
          <span>Daha çox</span>
        </button>
      </div>
    </nav>
  );

  return (
    <AppShell
      menuOpen={menuOpen}
      onMenuOpenChange={setMenuOpen}
      sidebar={({ isDrawer, close }) => (
        <Sidebar
          storeName={storeName}
          items={navItems}
          footer={sidebarFooter}
          isDrawer={isDrawer}
          onNavigate={isDrawer ? close : undefined}
        />
      )}
      header={
        <TopHeader
          title={storeName}
          onMenuClick={() => setMenuOpen(true)}
          search={
            <GlobalProductSearch
              value={search}
              onChange={setSearch}
              onSubmit={submitSearch}
            />
          }
          right={
            user && (
              <span className="flex h-10 items-center rounded-full bg-emerald-50 px-4 text-base font-semibold text-emerald-700">
                {user.name}
              </span>
            )
          }
        />
      }
      tabBar={tabBar}
    >
      <Outlet />
    </AppShell>
  );
}
