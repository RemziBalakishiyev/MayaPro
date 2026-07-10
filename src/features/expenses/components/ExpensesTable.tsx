import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Expense } from "@/types";

interface Props {
  expenses: Expense[];
  isLoading?: boolean;
  /** productId → mal adı (bağlı mal sütunu üçün) */
  productName: (id: string | null) => string;
}

export function ExpensesTable({ expenses, isLoading, productName }: Props) {
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
        header: "Kateqoriya",
        cell: ({ getValue }) => <Badge>{getValue() as string}</Badge>,
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
    ],
    [productName],
  );

  return (
    <DataTable
      columns={columns}
      data={expenses}
      isLoading={isLoading}
      emptyState={{
        title: "Xərc yoxdur",
        description: "İlk xərci əlavə edin.",
      }}
    />
  );
}
