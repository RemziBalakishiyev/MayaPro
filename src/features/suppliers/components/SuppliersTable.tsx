import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Plus, HandCoins, Pencil, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { DataTable } from "@/components/ui/DataTable";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  isLoading?: boolean;
  /**
   * FE#87 (TC-32.5/32.6): təchizatçı sorğusu şəbəkə xətası ilə uğursuz
   * olduqda boş-siyahı mesajı ƏVƏZİNƏ `InlineError` + "Yenidən" göstərilir.
   */
  isError?: boolean;
  onRetry?: () => void;
  canWrite?: boolean;
  onView: (supplier: Supplier) => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
  onEdit?: (supplier: Supplier) => void;
  onDelete?: (supplier: Supplier) => void;
}

function SupplierRowActions({
  supplier,
  canWrite,
  onView,
  onAddDebt,
  onPay,
  onEdit,
  onDelete,
}: {
  supplier: Supplier;
  canWrite: boolean;
  onView: (s: Supplier) => void;
  onAddDebt: (s: Supplier) => void;
  onPay: (s: Supplier) => void;
  onEdit?: (s: Supplier) => void;
  onDelete?: (s: Supplier) => void;
}) {
  const menuItems: ActionMenuItem[] = [
    {
      label: "Detal",
      icon: <Eye size={15} />,
      onClick: () => onView(supplier),
    },
    {
      label: "Borc əlavə et",
      icon: <Plus size={15} />,
      onClick: () => onAddDebt(supplier),
    },
    ...(canWrite && onEdit
      ? [
          {
            label: "Düzəliş",
            icon: <Pencil size={15} />,
            onClick: () => onEdit(supplier),
          } satisfies ActionMenuItem,
        ]
      : []),
    ...(canWrite && onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(supplier),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onPay(supplier)}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
      >
        <HandCoins size={14} />
        Ödəniş
      </button>
      <ActionMenu
        items={menuItems}
        aria-label={`${supplier.name} əməliyyatları`}
      />
    </div>
  );
}

export function SuppliersTable({
  suppliers,
  isLoading,
  isError,
  onRetry,
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
        cell: ({ row }) => (
          <SupplierRowActions
            supplier={row.original}
            canWrite={canWrite}
            onView={onView}
            onAddDebt={onAddDebt}
            onPay={onPay}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      },
    ],
    [onView, onAddDebt, onPay, onEdit, onDelete, canWrite],
  );

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      errorMessage="Təchizatçılar yüklənmədi"
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
                onClick={() => onPay(s)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 text-base font-semibold text-emerald-700 active:bg-emerald-100"
              >
                <HandCoins size={18} /> Ödəniş
              </button>
              <button
                onClick={() => onAddDebt(s)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-50 text-base font-semibold text-amber-700 active:bg-amber-100"
              >
                <Plus size={18} /> Borc
              </button>
              <ActionMenu
                items={[
                  {
                    label: "Detal",
                    icon: <Eye size={15} />,
                    onClick: () => onView(s),
                  },
                  ...(canWrite && onEdit
                    ? [
                        {
                          label: "Düzəliş",
                          icon: <Pencil size={15} />,
                          onClick: () => onEdit(s),
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                  ...(canWrite && onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(s),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${s.name} əməliyyatları`}
              />
            </div>
          </div>
        );
      }}
    />
  );
}
