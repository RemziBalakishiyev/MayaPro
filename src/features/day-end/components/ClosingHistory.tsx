import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/DataTable";
import { fmtMoney, fmtMoneySigned, fmtDate } from "@/lib/format";
import { useClosings } from "../queries";
import type { Closing } from "@/types";

export function ClosingHistory() {
  const {
    data: closings = [],
    isLoading,
    isError,
    refetch,
  } = useClosings();

  const rows = useMemo(
    () => [...closings].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [closings],
  );

  const columns = useMemo<ColumnDef<Closing, unknown>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Tarix",
        cell: ({ getValue }) => fmtDate(getValue() as string),
      },
      {
        accessorKey: "openingCash",
        header: "Açılış",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "cashSales",
        header: "Nağd satış",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-emerald-700">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "expenses",
        header: "Xərc",
        cell: ({ getValue }) => (
          <span className="tabular-nums text-red-600">
            {fmtMoney(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: "expectedCash",
        header: "Gözlənilən",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "actualCash",
        header: "Faktiki",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "difference",
        header: "Fərq",
        cell: ({ getValue }) => {
          const d = getValue() as number;
          return (
            <span
              className={`font-bold tabular-nums ${
                d < 0
                  ? "text-red-600"
                  : d > 0
                    ? "text-emerald-700"
                    : "text-stone-700"
              }`}
            >
              {fmtMoneySigned(d, "±")}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => void refetch()}
      errorMessage="Bağlanış tarixçəsi yüklənmədi"
      emptyState={{ title: "Bağlanış yoxdur" }}
    />
  );
}
