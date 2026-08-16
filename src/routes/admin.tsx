import { useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { LogOut, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/features/auth/store";
import { useTenants, usePlatformStats, useBlockTenant, useUnblockTenant } from "@/features/admin/queries";
import { StatsBar } from "@/features/admin/components/StatsBar";
import { TenantsTable, isExpiringSoon } from "@/features/admin/components/TenantsTable";
import { tenantStatusLabel } from "@/features/admin/components/TenantStatusBadge";
import { ApproveTenantModal } from "@/features/admin/components/ApproveTenantModal";
import { RecordPaymentModal } from "@/features/admin/components/RecordPaymentModal";
import { PaymentHistoryDrawer } from "@/features/admin/components/PaymentHistoryDrawer";
import { NewTenantModal } from "@/features/admin/components/NewTenantModal";
import type { Tenant, TenantFilterStatus } from "@/features/admin/types";

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["PendingApproval", "Active", "Blocked", "Expired"]).optional(),
});

/**
 * FE#183 (AC-8/AC-9/AC-10) — `/admin` yalnız `platform_admin` roluna görünür,
 * öz sadə layout-unda (sistemin sidebar/TopHeader-i YOX). Adi mağaza rolları
 * bura girə bilməz — girsə `/`-ə (adi app guard-ı orada "/login"-ə aparır,
 * user boşdursa) geri yönləndirilir.
 */
export const Route = createFileRoute("/admin")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (!user) throw redirect({ to: "/login" });
    if (user.role !== "platform_admin") throw redirect({ to: "/" });
  },
  component: AdminPage,
});

const STATUS_TABS: { key: TenantFilterStatus | "all"; label: string }[] = [
  { key: "all", label: "Hamısı" },
  { key: "PendingApproval", label: "Gözləyir" },
  { key: "Active", label: "Aktiv" },
  { key: "Expired", label: "Müddəti bitib" },
  { key: "Blocked", label: "Bloklu" },
];

function AdminPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: tenants = [], isLoading, isError, refetch } = useTenants();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const blockMut = useBlockTenant();
  const unblockMut = useUnblockTenant();

  const [approveFor, setApproveFor] = useState<Tenant | null>(null);
  const [blockFor, setBlockFor] = useState<Tenant | null>(null);
  const [unblockFor, setUnblockFor] = useState<Tenant | null>(null);
  const [payFor, setPayFor] = useState<Tenant | null>(null);
  const [historyFor, setHistoryFor] = useState<Tenant | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    return tenants.filter((t) => {
      if (search.status) {
        const label =
          search.status === "Expired"
            ? "Müddəti bitib"
            : search.status === "PendingApproval"
              ? "Gözləyir"
              : search.status === "Blocked"
                ? "Bloklu"
                : "Aktiv";
        if (tenantStatusLabel(t) !== label) return false;
      }
      if (q) {
        const hit =
          t.name.toLowerCase().includes(q) ||
          (t.ownerName ?? "").toLowerCase().includes(q) ||
          (t.phone ?? "").toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [tenants, search]);

  const expiringSoonCount = useMemo(
    () => tenants.filter((t) => isExpiringSoon(t)).length,
    [tenants],
  );

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  const handleBlock = async () => {
    if (!blockFor) return;
    try {
      await blockMut.mutateAsync(blockFor.id);
      toast.success(`${blockFor.name} bloklandı`);
      setBlockFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bloklama uğursuz oldu");
    }
  };

  const handleUnblock = async () => {
    if (!unblockFor) return;
    try {
      await unblockMut.mutateAsync(unblockFor.id);
      toast.success(`${unblockFor.name} blokdan çıxarıldı`);
      setUnblockFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Əməliyyat uğursuz oldu");
    }
  };

  return (
    <div className="min-h-full bg-stone-100">
      {/* FE#183 (AC-8) — öz sadə başlığı: sistemin Sidebar/TopHeader-i burada YOXDUR. */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-stone-900">Platforma Admin</h1>
              {expiringSoonCount > 0 && (
                <p className="text-xs font-medium text-orange-600">
                  {expiringSoonCount} mağazanın müddəti tezliklə bitir
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 sm:inline-flex">
                {user.name}
              </span>
            )}
            <Button variant="secondary" size="sm" icon={<LogOut size={15} />} onClick={handleLogout}>
              Çıxış
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <StatsBar stats={stats} isLoading={statsLoading} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-stone-900">Mağazalar</h2>
          <Button icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
            Yeni mağaza
          </Button>
        </div>

        <TableToolbar
          search={
            <LocalTableSearch
              value={search.q ?? ""}
              onChange={(v) => navigate({ search: (prev) => ({ ...prev, q: v || undefined }) })}
              placeholder="Bu siyahıda axtar... (ad, sahibkar, telefon)"
              ariaLabel="Mağaza siyahısında axtar"
              className="min-w-[220px] max-w-sm flex-1"
            />
          }
          actions={
            <div
              role="tablist"
              aria-label="Statusa görə filtr"
              className="flex flex-wrap gap-0.5 rounded-control border border-stone-200 bg-white p-1"
            >
              {STATUS_TABS.map(({ key, label }) => {
                const active = (search.status ?? "all") === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() =>
                      navigate({
                        search: (prev) => ({
                          ...prev,
                          status: key === "all" ? undefined : key,
                        }),
                      })
                    }
                    className={cn(
                      "min-h-[40px] whitespace-nowrap rounded-chip px-3.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          }
        />

        <TenantsTable
          tenants={filtered}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          onApprove={setApproveFor}
          onBlock={setBlockFor}
          onUnblock={setUnblockFor}
          onPay={setPayFor}
          onHistory={setHistoryFor}
          emptyState={
            (search.q ?? "").trim() || search.status
              ? {
                  title: "Filterə uyğun mağaza yoxdur",
                  description: "Axtarışı və ya status filtrini dəyişin.",
                }
              : undefined
          }
        />
      </main>

      <ApproveTenantModal open={!!approveFor} onClose={() => setApproveFor(null)} tenant={approveFor} />
      <RecordPaymentModal open={!!payFor} onClose={() => setPayFor(null)} tenant={payFor} />
      <PaymentHistoryDrawer tenant={historyFor} onClose={() => setHistoryFor(null)} />
      <NewTenantModal open={newOpen} onClose={() => setNewOpen(false)} />

      <ConfirmModal
        open={!!blockFor}
        onClose={() => setBlockFor(null)}
        onConfirm={() => void handleBlock()}
        title="Mağazanı blokla"
        message={`${blockFor?.name ?? "Bu mağaza"} bloklanacaq — sahibi sistemə daxil ola bilməyəcək. Davam etmək istəyirsiniz?`}
        confirmText="Blokla"
        danger
        isPending={blockMut.isPending}
      />
      <ConfirmModal
        open={!!unblockFor}
        onClose={() => setUnblockFor(null)}
        onConfirm={() => void handleUnblock()}
        title="Blokdan çıxar"
        message={`${unblockFor?.name ?? "Bu mağaza"} blokdan çıxarılacaq və yenidən sistemə daxil ola biləcək.`}
        confirmText="Blokdan çıxar"
        isPending={unblockMut.isPending}
      />
    </div>
  );
}
