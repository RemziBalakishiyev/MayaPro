import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, HandCoins, MessageCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  isLoading?: boolean;
  onView: (customer: Customer) => void;
  onPay: (customer: Customer) => void;
  emptyState?: { title: string; description?: string };
}

/** Son alış / son ödənişdən ən yenisi. */
function lastActivityDate(c: Customer): string {
  const a = c.lastPurchaseDate || "";
  const b = c.lastPaymentDate || "";
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export function CustomersTable({
  customers,
  isLoading,
  onView,
  onPay,
  emptyState,
}: Props) {
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);
  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Müştəri",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Telefon",
        cell: ({ getValue }) => (
          <span className="text-xs">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "remainingDebt",
        header: "Qalıq borc",
        cell: ({ getValue }) => {
          const debt = getValue() as number;
          return (
            <span
              className={`font-bold tabular-nums ${
                debt > 0 ? "text-red-600" : "text-emerald-700"
              }`}
            >
              {fmtMoney(debt)}
            </span>
          );
        },
      },
      {
        id: "lastActivity",
        accessorFn: (c) => lastActivityDate(c),
        header: "Son əməliyyat",
        cell: ({ getValue }) => fmtDate((getValue() as string) || ""),
      },
      {
        id: "status",
        header: "Status",
        enableSorting: false,
        cell: ({ row }) => {
          const debt = row.original.remainingDebt;
          return (
            <Badge tone={debt > 0 ? "Borclu" : "Ödənilib"}>
              {debt > 0 ? "Borclu" : "Ödənilib"}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end gap-1">
              <button
                title="Detal"
                onClick={() => onView(c)}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <Eye size={15} />
              </button>
              <button
                title="Ödəniş"
                onClick={() => onPay(c)}
                className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
              >
                <HandCoins size={15} />
              </button>
              {c.remainingDebt > 0 && (
                <a
                  title="WhatsApp xatırlatma"
                  href={waLink(c.phone, c.remainingDebt, waTemplate)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                >
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onPay, waTemplate],
  );

  return (
    <DataTable
      columns={columns}
      data={customers}
      isLoading={isLoading}
      emptyState={
        emptyState ?? {
          title: "Hələ müştəri yoxdur",
          description: "Yuxarıdakı «Yeni müştəri» düyməsi ilə əlavə edin.",
        }
      }
      mobileCard={(c) => {
        const debt = c.remainingDebt;
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-stone-900">
                  {c.name}
                </p>
                <p className="text-sm text-stone-400">{c.phone || "—"}</p>
              </div>
              <Badge tone={debt > 0 ? "Borclu" : "Ödənilib"}>
                {debt > 0 ? "Borclu" : "Ödənilib"}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-medium text-stone-500">
                Qalıq borc
              </span>
              <span
                className={`text-xl font-bold tabular-nums ${
                  debt > 0 ? "text-red-600" : "text-emerald-700"
                }`}
              >
                {fmtMoney(debt)}
              </span>
            </div>
            <div className="mt-3 flex gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onView(c)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
              >
                <Eye size={18} /> Detal
              </button>
              <button
                onClick={() => onPay(c)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} /> Ödəniş
              </button>
              {debt > 0 && (
                <a
                  href={waLink(c.phone, debt, waTemplate)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp xatırlatma"
                  className="flex h-11 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 active:bg-green-100"
                >
                  <MessageCircle size={18} />
                </a>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
