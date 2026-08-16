import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, History, Lock, ShieldCheck, Wallet } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney } from "@/lib/format";
import { TenantStatusBadge } from "./TenantStatusBadge";
import type { Tenant } from "../types";

/** Bitməyə N gündən az qalıbsa (AC-11/AC-13) `true` — narıncı vurğu. */
export function isExpiringSoon(tenant: Tenant): boolean {
  if (tenant.status !== "Active" || tenant.isExpired || !tenant.expiresAt) return false;
  const daysLeft = Math.ceil((new Date(tenant.expiresAt).getTime() - Date.now()) / 86400000);
  return daysLeft >= 0 && daysLeft < 7;
}

interface Props {
  tenants: Tenant[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onApprove: (tenant: Tenant) => void;
  onBlock: (tenant: Tenant) => void;
  onUnblock: (tenant: Tenant) => void;
  onPay: (tenant: Tenant) => void;
  onHistory: (tenant: Tenant) => void;
  emptyState?: { title: string; description?: string };
}

function ExpiresAtCell({ tenant }: { tenant: Tenant }) {
  if (!tenant.expiresAt) return <EmptyValue label="bitmə tarixi yoxdur (vaxtsız)" />;
  const soon = isExpiringSoon(tenant);
  return (
    <span
      className={cn(
        "tabular-nums",
        soon && "font-bold text-orange-600",
        tenant.isExpired && "font-bold text-orange-700",
      )}
      title={soon ? "Bitməsinə 7 gündən az qalıb" : undefined}
    >
      {fmtDate(tenant.expiresAt)}
    </span>
  );
}

export function TenantsTable({
  tenants,
  isLoading,
  isError,
  onRetry,
  onApprove,
  onBlock,
  onUnblock,
  onPay,
  onHistory,
  emptyState,
}: Props) {
  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Mağaza",
        cell: ({ row }) => (
          <span className="font-semibold text-stone-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "ownerName",
        header: "Sahibkar",
        cell: ({ getValue }) => {
          const v = getValue() as string | null;
          return v || <EmptyValue label="sahibkar adı yoxdur" />;
        },
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => <CopyablePhone phone={(getValue() as string | null) || ""} />,
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => <TenantStatusBadge tenant={row.original} />,
      },
      {
        id: "expiresAt",
        accessorFn: (t) => t.expiresAt ?? "",
        header: "Bitmə tarixi",
        cell: ({ row }) => <ExpiresAtCell tenant={row.original} />,
      },
      {
        id: "lastPayment",
        accessorFn: (t) => t.lastPaymentAt ?? "",
        header: "Son ödəniş",
        cell: ({ row }) => {
          const t = row.original;
          if (!t.lastPaymentAt) return <EmptyValue label="ödəniş edilməyib" />;
          return (
            <span className="tabular-nums">
              {fmtDate(t.lastPaymentAt)}
              <span className="ml-1.5 text-stone-400">
                ({fmtMoney(t.lastPaymentAmount ?? 0)})
              </span>
            </span>
          );
        },
      },
      {
        accessorKey: "totalPaid",
        header: "Ümumi ödənilib",
        cell: ({ getValue }) => (
          <span className="font-semibold tabular-nums text-stone-800">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original;
          const items: ActionMenuItem[] = [
            ...(t.status === "PendingApproval"
              ? [
                  {
                    label: "Təsdiqlə",
                    icon: <CheckCircle2 size={15} />,
                    onClick: () => onApprove(t),
                    tone: "success" as const,
                  } satisfies ActionMenuItem,
                ]
              : []),
            ...(t.status === "Blocked"
              ? [
                  {
                    label: "Blokdan çıxar",
                    icon: <ShieldCheck size={15} />,
                    onClick: () => onUnblock(t),
                    tone: "success" as const,
                  } satisfies ActionMenuItem,
                ]
              : []),
            ...(t.status === "Active"
              ? [
                  {
                    label: "Blokla",
                    icon: <Lock size={15} />,
                    onClick: () => onBlock(t),
                    tone: "danger" as const,
                  } satisfies ActionMenuItem,
                ]
              : []),
            {
              label: "Ödəniş yaz",
              icon: <Wallet size={15} />,
              onClick: () => onPay(t),
            },
            {
              label: "Tarixçə",
              icon: <History size={15} />,
              onClick: () => onHistory(t),
            },
          ];
          return (
            <div className="flex justify-end">
              <ActionMenu items={items} aria-label={`${t.name} əməliyyatları`} />
            </div>
          );
        },
      },
    ],
    [onApprove, onBlock, onUnblock, onPay, onHistory],
  );

  return (
    <DataTable
      columns={columns}
      data={tenants}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Mağaza siyahısı yüklənmədi"
      emptyState={
        emptyState ?? {
          title: "Hələ mağaza yoxdur",
          description: "Yuxarıdakı «Yeni mağaza» düyməsi ilə əlavə edin.",
        }
      }
      mobileCard={(t) => (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-stone-900">{t.name}</p>
              <p className="truncate text-sm text-stone-500">{t.ownerName || "—"}</p>
            </div>
            <TenantStatusBadge tenant={t} />
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-stone-500">Bitmə tarixi</span>
            <ExpiresAtCell tenant={t} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-sm">
            <span className="text-stone-500">Ümumi ödənilib</span>
            <span className="font-semibold tabular-nums text-stone-800">
              {fmtMoney(t.totalPaid)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
            {t.status === "PendingApproval" && (
              <button
                onClick={() => onApprove(t)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <CheckCircle2 size={18} /> Təsdiqlə
              </button>
            )}
            {t.status === "Blocked" && (
              <button
                onClick={() => onUnblock(t)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <ShieldCheck size={18} /> Blokdan çıxar
              </button>
            )}
            {t.status === "Active" && (
              <button
                onClick={() => onBlock(t)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-50 text-base font-semibold text-red-700 active:bg-red-100"
              >
                <Lock size={18} /> Blokla
              </button>
            )}
            <button
              onClick={() => onPay(t)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
            >
              <Wallet size={18} /> Ödəniş
            </button>
            <button
              onClick={() => onHistory(t)}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
            >
              <History size={18} /> Tarixçə
            </button>
          </div>
        </div>
      )}
    />
  );
}
