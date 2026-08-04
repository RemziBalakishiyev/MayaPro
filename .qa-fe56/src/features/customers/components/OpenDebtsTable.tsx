import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { HandCoins, MessageCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { fmtMoney, fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import type { Customer, OpenDebt } from "@/types";

interface Props {
  debts: OpenDebt[];
  isLoading?: boolean;
  /** customerId → tam müştəri qeydi (Ödəniş al / WhatsApp / drawer üçün). */
  customersById: Map<string, Customer>;
  onPay: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  emptyState?: { title: string; description?: string };
}

/** 60+ gün — qırmızı, 30+ gün — sarı (amber), daha az — sakit boz. */
function daysOldTone(daysOld: number): string {
  if (daysOld >= 60) return "text-red-600";
  if (daysOld >= 30) return "text-amber-600";
  return "text-stone-400";
}

function daysOldLabel(daysOld: number): string {
  return daysOld === 0 ? "Bu gün" : `${daysOld} gün əvvəl`;
}

/**
 * FE#40 — "Borclar" görünüşü: BE#21 `GET /api/customers/open-debts`
 * sətirləri, mənbə-mənbə (ilkin borc / hər qalıqlı satış ayrı sətir).
 * `CustomersTable`-dəki mobileCard responsiv naxışı təkrarlanır.
 */
export function OpenDebtsTable({
  debts,
  isLoading,
  customersById,
  onPay,
  onView,
  emptyState,
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);

  const columns = useMemo<ColumnDef<OpenDebt, unknown>[]>(
    () => [
      {
        id: "customer",
        header: "Müştəri",
        accessorFn: (d) => d.customerName,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-900">
                {d.customerName}
              </p>
              <CopyablePhone
                phone={d.phone || ""}
                className="text-xs text-stone-400"
              />
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Nə üçün",
        accessorFn: (d) => d.description,
        cell: ({ row }) => (
          <span className="text-sm text-stone-700">
            {row.original.description}
          </span>
        ),
      },
      {
        id: "sourceDate",
        header: "Tarix",
        accessorFn: (d) => d.sourceDate,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div>
              <p className="tabular-nums text-stone-700">
                {fmtDate(d.sourceDate)}
              </p>
              <p
                className={cn(
                  "text-xs font-medium tabular-nums",
                  daysOldTone(d.daysOld),
                )}
              >
                {daysOldLabel(d.daysOld)}
              </p>
            </div>
          );
        },
      },
      {
        id: "remaining",
        header: "Qalıq",
        accessorFn: (d) => d.remaining,
        cell: ({ row }) => (
          <span className="font-bold tabular-nums text-red-600">
            {fmtMoney(row.original.remaining)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const d = row.original;
          const customer = customersById.get(d.customerId);
          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                disabled={!customer}
                onClick={() => customer && onPay(customer)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HandCoins size={14} />
                Ödəniş al
              </button>
              <a
                href={waLink(
                  d.phone || "",
                  customer?.remainingDebt ?? d.remaining,
                  waTemplate,
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${d.customerName} — WhatsApp`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <MessageCircle size={14} />
              </a>
            </div>
          );
        },
      },
    ],
    [customersById, onPay, waTemplate],
  );

  return (
    <DataTable
      columns={columns}
      data={debts}
      isLoading={isLoading}
      onRowClick={(d) => {
        const customer = customersById.get(d.customerId);
        if (customer) onView(customer);
      }}
      emptyState={
        emptyState ?? {
          title: "Açıq borc yoxdur",
          description: "Bütün müştərilər hesablaşıb.",
        }
      }
      mobileCard={(d) => {
        const customer = customersById.get(d.customerId);
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-stone-900">
                  {d.customerName}
                </p>
                <CopyablePhone
                  phone={d.phone || ""}
                  className="mt-0.5 text-left text-sm tabular-nums text-stone-400 underline-offset-2 hover:text-emerald-700 hover:underline"
                />
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular-nums text-xs text-stone-400">
                  {fmtDate(d.sourceDate)}
                </p>
                <p
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    daysOldTone(d.daysOld),
                  )}
                >
                  {daysOldLabel(d.daysOld)}
                </p>
              </div>
            </div>
            <p className="mt-2 truncate text-sm text-stone-600">
              {d.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Qalıq
              </span>
              <span className="text-xl font-bold tabular-nums text-red-600">
                {fmtMoney(d.remaining)}
              </span>
            </div>
            <div
              className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                disabled={!customer}
                onClick={() => customer && onPay(customer)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <HandCoins size={18} /> Ödəniş al
              </button>
              <a
                href={waLink(
                  d.phone || "",
                  customer?.remainingDebt ?? d.remaining,
                  waTemplate,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
              >
                <MessageCircle size={18} /> WhatsApp
              </a>
            </div>
          </div>
        );
      }}
    />
  );
}
