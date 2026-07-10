import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";
import { EmptyState } from "./EmptyState";

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: { title: string; description?: string };
  /** Səhifədəki sətir sayı (defolt 10) */
  pageSize?: number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  emptyState,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
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

  const { pageIndex, pageSize: size } = table.getState().pagination;
  const total = data.length;
  const from = pageIndex * size + 1;
  const to = Math.min((pageIndex + 1) * size, total);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-card">
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
                      className="whitespace-nowrap px-4 py-3.5 text-left text-sm font-bold text-stone-500"
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-stone-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="whitespace-nowrap px-4 py-4 text-base text-stone-700"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
}
