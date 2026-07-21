import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Plus, HandCoins, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  isLoading?: boolean;
  canWrite?: boolean;
  onView: (supplier: Supplier) => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
}

export function SuppliersTable({
  suppliers,
  isLoading,
  canWrite = false,
  onView,
  onAddDebt,
  onPay,
  onEdit,
  onDelete,
}: Props) {
  const columns = useMemo<ColumnDef<Supplier, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Təchizatçı",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Əlaqə",
        cell: ({ getValue }) => (
          <span className="text-xs">{(getValue() as string) || "—"}</span>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Mal sayı",
        cell: ({ getValue }) => (
          <span className="tabular-nums font-semibold text-stone-700">
            {(getValue() as number) ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "remainingDebt",
        header: "Mənim borcum",
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
        accessorKey: "lastPaymentDate",
        header: "Son ödəniş",
        cell: ({ getValue }) => fmtDate((getValue() as string) || ""),
      },
      {
        id: "actions",
        header: "Əməliyyat",
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          const hasDebt = s.remainingDebt > 0;
          return (
            <div className="flex justify-end gap-1">
              <button
                title="Detal"
                onClick={() => onView(s)}
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
              >
                <Eye size={15} />
              </button>
              <button
                title="Borc əlavə et"
                onClick={() => onAddDebt(s)}
                className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
              >
                <Plus size={15} />
              </button>
              <button
                title="Ödəniş et"
                onClick={() => onPay(s)}
                className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
              >
                <HandCoins size={15} />
              </button>
              {canWrite && onEdit && (
                <button
                  title="Düzəliş"
                  onClick={() => onEdit(s)}
                  className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                >
                  <Pencil size={15} />
                </button>
              )}
              {canWrite && onDelete && (
                <button
                  title={
                    hasDebt
                      ? "Borcu olan təchizatçı silinə bilməz"
                      : "Sil"
                  }
                  disabled={hasDebt}
                  onClick={() => onDelete(s)}
                  className="rounded-md p-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onAddDebt, onPay, onEdit, onDelete, canWrite],
  );

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      isLoading={isLoading}
      emptyState={{
        title: "Hələ təchizatçı yoxdur",
        description: "Yuxarıdakı «Yeni təchizatçı» düyməsi ilə əlavə edin.",
      }}
      mobileCard={(s) => {
        const debt = s.remainingDebt;
        return (
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-stone-900">
                  {s.name}
                </p>
                <p className="text-sm text-stone-400">
                  {s.phone || "—"} · {s.itemCount} mal
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-stone-400">Mənim borcum</p>
                <p
                  className={`text-xl font-bold tabular-nums ${
                    debt > 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {fmtMoney(debt)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              <button
                onClick={() => onView(s)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
              >
                <Eye size={18} /> Detal
              </button>
              <button
                onClick={() => onAddDebt(s)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-base font-semibold text-amber-700 active:bg-amber-100"
              >
                <Plus size={18} /> Borc
              </button>
              <button
                onClick={() => onPay(s)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} /> Ödəniş
              </button>
              {canWrite && onEdit && (
                <button
                  onClick={() => onEdit(s)}
                  aria-label="Düzəliş"
                  className="flex h-11 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-600 active:bg-stone-200"
                >
                  <Pencil size={18} />
                </button>
              )}
              {canWrite && onDelete && (
                <button
                  title={
                    debt > 0
                      ? "Borcu olan təchizatçı silinə bilməz"
                      : "Sil"
                  }
                  disabled={debt > 0}
                  onClick={() => onDelete(s)}
                  aria-label="Sil"
                  className="flex h-11 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
