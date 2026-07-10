import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Plus, HandCoins } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { fmtMoney, fmtDate } from "@/lib/format";
import type { Supplier } from "@/types";

interface Props {
  suppliers: Supplier[];
  isLoading?: boolean;
  onView: (supplier: Supplier) => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
}

export function SuppliersTable({
  suppliers,
  isLoading,
  onView,
  onAddDebt,
  onPay,
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
            </div>
          );
        },
      },
    ],
    [onView, onAddDebt, onPay],
  );

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      isLoading={isLoading}
      emptyState={{ title: "Təchizatçı tapılmadı" }}
    />
  );
}
