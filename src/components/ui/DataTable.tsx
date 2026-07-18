import { useState } from "react";
import type { ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowData,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";
import { EmptyState } from "./EmptyState";

// Sütunlara responsiv gizlətmə üçün className vermək imkanı.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: { title: string; description?: string };
  /** Səhifədəki sətir sayı (defolt 10) */
  pageSize?: number;
  /** Server pagination / xarici "Daha çox" üçün daxili səhifələməni gizlət. */
  hidePagination?: boolean;
  /**
   * Mobil kart görünüşü. Verilərsə, kiçik ekranda (md-dən aşağı) cədvəl əvəzinə
   * hər sətir bu funksiyanın qaytardığı kart kimi göstərilir; md-dən yuxarı cədvəl.
   */
  mobileCard?: (row: TData) => ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  emptyState,
  pageSize = 10,
  hidePagination = false,
  mobileCard,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(hidePagination
      ? {}
      : {
          getPaginationRowModel: getPaginationRowModel(),
          initialState: { pagination: { pageSize } },
        }),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
        <Spinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyState?.title ?? "Məlumat yoxdur"}
        hint={emptyState?.description}
      />
    );
  }

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize: size } = table.getState().pagination;
  const total = data.length;
  const from = pageIndex * size + 1;
  const to = Math.min((pageIndex + 1) * size, total);

  return (
    <div className="space-y-3">
      {/* Mobil: kart görünüşü (md-dən aşağı) */}
      {mobileCard && (
        <div className="space-y-3 md:hidden">
          {rows.map((row) => (
            <div key={row.id}>{mobileCard(row.original)}</div>
          ))}
        </div>
      )}

      {/* Desktop/planşet: cədvəl. mobileCard varsa yalnız md-dən yuxarı görünür. */}
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card",
          mobileCard && "hidden md:block",
        )}
      >
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "whitespace-nowrap px-3 py-3.5 text-left text-sm font-bold text-stone-500",
                        (header.column.columnDef.meta as { className?: string })
                          ?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!canSort}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "inline-flex items-center gap-1",
                            canSort && "cursor-pointer select-none hover:text-stone-700",
                          )}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort &&
                            (sorted === "asc" ? (
                              <ChevronUp size={15} />
                            ) : sorted === "desc" ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronsUpDown size={15} className="text-stone-300" />
                            ))}
                        </button>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-stone-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "whitespace-nowrap px-3 py-4 text-base text-stone-700",
                      (cell.column.columnDef.meta as { className?: string })
                        ?.className,
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hidePagination && (
        <div className="flex items-center justify-between px-1 text-sm text-stone-500">
          <span className="tabular-nums">
            {from}-dən {to}-yə, cəmi {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="min-h-[44px] rounded-xl bg-white px-5 text-base font-semibold text-stone-700 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Əvvəlki
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="min-h-[44px] rounded-xl bg-white px-5 text-base font-semibold text-stone-700 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Növbəti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
