import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Expense } from "@/types";

/** Xərc mənbəyi → badge mətni ("source" sahəsi backend/mock-dan). */
const SOURCE_LABEL: Record<Expense["source"], string> = {
  general: "Ümumi",
  product: "Mala bağlı",
};

interface Props {
  expenses: Expense[];
  isLoading?: boolean;
  canWrite?: boolean;
  /** productId → mal adı (bağlı mal sütunu üçün) */
  productName: (id: string | null) => string;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expense: Expense) => void;
}

function ExpenseRowActions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit?: (e: Expense) => void;
  onDelete?: (e: Expense) => void;
}) {
  const menuItems: ActionMenuItem[] = [
    ...(onDelete
      ? [
          {
            label: "Sil",
            icon: <Trash2 size={15} />,
            onClick: () => onDelete(expense),
            tone: "danger" as const,
          } satisfies ActionMenuItem,
        ]
      : []),
  ];

  return (
    <div className="flex items-center justify-end gap-1.5">
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(expense)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-stone-100 px-2.5 text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-200"
        >
          <Pencil size={14} />
          Düzəliş
        </button>
      )}
      <ActionMenu
        items={menuItems}
        aria-label={`${expense.title} əməliyyatları`}
      />
    </div>
  );
}

export function ExpensesTable({
  expenses,
  isLoading,
  canWrite = false,
  productName,
  onEdit,
  onDelete,
}: Props) {
  const columns = useMemo<ColumnDef<Expense, unknown>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tarix",
        cell: ({ getValue }) => fmtDate(getValue() as string),
      },
      {
        accessorKey: "title",
        header: "Xərc",
        cell: ({ getValue }) => (
          <span className="font-semibold text-stone-900">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Növ",
        cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
      },
      {
        accessorKey: "source",
        header: "Mənbə",
        cell: ({ getValue }) => (
          <Badge>{SOURCE_LABEL[getValue() as Expense["source"]]}</Badge>
        ),
      },
      {
        id: "product",
        header: "Bağlı mal",
        accessorFn: (e) => productName(e.productId),
        cell: ({ row }) => {
          const name = productName(row.original.productId);
          return row.original.productId ? (
            <span className="text-xs font-medium text-emerald-700">{name}</span>
          ) : (
            <span className="text-xs text-stone-400">{name}</span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Məbləğ",
        cell: ({ getValue }) => (
          <span className="font-bold tabular-nums text-red-600">
            −{fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Qeyd",
        enableSorting: false,
        cell: ({ getValue }) => (
          <span className="text-xs text-stone-400">
            {(getValue() as string) || "—"}
          </span>
        ),
      },
      ...(canWrite
        ? [
            {
              id: "actions",
              header: "Əməliyyat",
              enableSorting: false,
              cell: ({ row }: { row: { original: Expense } }) => (
                <ExpenseRowActions
                  expense={row.original}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ),
            } as ColumnDef<Expense, unknown>,
          ]
        : []),
    ],
    [productName, canWrite, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={expenses}
      isLoading={isLoading}
      emptyState={{
        title: "Bu ay xərc yoxdur",
        description: "«Yeni xərc» düyməsi ilə ilk xərci əlavə edin.",
      }}
      mobileCard={(e) => (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-stone-900">
                {e.title}
              </p>
              <p className="text-sm text-stone-400">{fmtDate(e.date)}</p>
            </div>
            <span className="shrink-0 text-xl font-bold tabular-nums text-red-600">
              −{fmtMoney(e.amount)}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge>{e.category}</Badge>
            <Badge>{SOURCE_LABEL[e.source]}</Badge>
            {e.productId && (
              <span className="text-sm font-medium text-emerald-700">
                {productName(e.productId)}
              </span>
            )}
          </div>
          {e.note && (
            <p className="mt-2 text-sm text-stone-500">{e.note}</p>
          )}
          {canWrite && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3">
              {onEdit && (
                <button
                  onClick={() => onEdit(e)}
                  className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-stone-100 text-base font-semibold text-stone-700 active:bg-stone-200"
                >
                  <Pencil size={18} /> Düzəliş
                </button>
              )}
              <ActionMenu
                items={[
                  ...(onDelete
                    ? [
                        {
                          label: "Sil",
                          icon: <Trash2 size={15} />,
                          onClick: () => onDelete(e),
                          tone: "danger" as const,
                        } satisfies ActionMenuItem,
                      ]
                    : []),
                ]}
                aria-label={`${e.title} əməliyyatları`}
              />
            </div>
          )}
        </div>
      )}
    />
  );
}
