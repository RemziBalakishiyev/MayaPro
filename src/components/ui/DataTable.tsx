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
import { InlineError } from "./InlineError";

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
  /**
   * FE#127 (TC-32): sorğu şəbəkə/server xətası ilə uğursuz olduqda `true`
   * olmalıdır. Bu halda "boş siyahı" (`emptyState`) ƏVƏZİNƏ `InlineError` +
   * "Yenidən cəhd et" düyməsi göstərilir — istifadəçi xətanı boş nəticə ilə
   * qarışdırmır.
   */
  isError?: boolean;
  /** `isError` true olduqda "Yenidən cəhd et" düyməsinin klik handler-i. */
  onRetry?: () => void;
  /** Xəta mesajı (defolt: "Siyahı yüklənmədi"). */
  errorMessage?: string;
  emptyState?: { title: string; description?: string };
  /** Səhifədəki sətir sayı (defolt 10) */
  pageSize?: number;
  /** Server pagination / xarici "Daha çox" üçün daxili səhifələməni gizlət. */
  hidePagination?: boolean;
  /** Xarici kart içində: border/shadow/radius yox, sıx hüceyrə padding. */
  embedded?: boolean;
  /** Sətir / mobil kart klik — detal drawer üçün. */
  onRowClick?: (row: TData) => void;
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
  isError,
  onRetry,
  errorMessage = "Siyahı yüklənmədi",
  emptyState,
  pageSize = 10,
  hidePagination = false,
  embedded = false,
  onRowClick,
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

  // FE#127 (TC-32): xəta vəziyyəti «boş nəticə»dən ƏVVƏL yoxlanılır — şəbəkə
  // xətası heç vaxt yanıldıcı "boş siyahı" kimi göstərilmir.
  if (isError) {
    return (
      <InlineError
        message={errorMessage}
        hint="Şəbəkə və ya server cavab vermədi."
        onRetry={onRetry}
      />
    );
  }

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
            <div
              key={row.id}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={
                onRowClick ? () => onRowClick(row.original) : undefined
              }
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row.original);
                      }
                    }
                  : undefined
              }
              className={cn(
                onRowClick &&
                  // rounded-xl — mobil kartın küncləri ilə eyni: fokus halqası
                  // kartın kənarını təkrarlasın, kvadrat çərçivə çıxmasın.
                  "cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
              )}
            >
              {mobileCard(row.original)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop/planşet: cədvəl. mobileCard varsa yalnız md-dən yuxarı görünür. */}
      <div
        className={cn(
          "overflow-x-auto bg-white",
          embedded
            ? "rounded-none border-0 shadow-none"
            : "rounded-2xl border border-stone-200 shadow-card",
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
                      scope="col"
                      aria-sort={
                        !canSort
                          ? undefined
                          : sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : "none"
                      }
                      className={cn(
                        "whitespace-nowrap px-3 text-left text-sm font-bold text-stone-500",
                        embedded ? "py-2.5" : "py-3.5",
                        header.column.columnDef.meta?.className,
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex min-h-[40px] cursor-pointer select-none items-center gap-1 hover:text-stone-700"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ChevronUp size={15} />
                          ) : sorted === "desc" ? (
                            <ChevronDown size={15} />
                          ) : (
                            <ChevronsUpDown size={15} className="text-stone-300" />
                          )}
                        </button>
                      ) : (
                        // Sıralanmayan sütun: disabled düymə əvəzinə sadə span —
                        // belədə başlıqdakı title tooltip-i (izah) hover-də görünür.
                        <span className="inline-flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                // Klik davranışı YALNIZ `onRowClick` verilmiş cədvəllərdə açılır —
                // digər cədvəllər (mal, müştəri, xərc, təchizatçı) toxunulmaz qalır.
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        // Sətir daxilindəki düymə/menyu fokusdadırsa Enter/Space
                        // ona məxsusdur — drawer açılmamalıdır.
                        if (e.target !== e.currentTarget) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row.original);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "transition-colors hover:bg-stone-50",
                  onRowClick &&
                    "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "whitespace-nowrap px-3 text-base text-stone-700",
                      embedded ? "py-3" : "py-4",
                      // Başlıqla eyni sinif → responsiv gizlətmə th/td-də sinxron
                      cell.column.columnDef.meta?.className,
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
