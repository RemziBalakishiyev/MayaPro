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
import { EmptyState } from "./EmptyState";
import { InlineError } from "./InlineError";
import { TableSkeleton } from "./LoadingSkeleton";
import { TablePagination } from "./TablePagination";
import { StaleDataBanner } from "./StaleDataBanner";

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
   * FE#69 (F-44): sorğu xətası «boş siyahı» kimi göstərilmir — `InlineError`
   * + «Yenidən» düyməsi render olunur.
   */
  isError?: boolean;
  onRetry?: () => void;
  errorMessage?: string;
  /**
   * FE#142: `data` tipcə həmişə array olduğu üçün (undefined ola bilməz),
   * "heç vaxt uğurla yüklənməyib" halı defolt olaraq `data.length === 0`
   * proxy-si ilə yoxlanılır. Bu proxy, TanStack Query-nin arxa-fon refetch
   * xətasında ƏVVƏLKİ uğurlu (legitim BOŞ) nəticəni saxlaması səbəbindən,
   * "heç vaxt yüklənməyib" ilə "uğurla yüklənmiş, lakin BOŞ + indi arxa-fon
   * xətası" hallarını ayırd edə bilmir — hər ikisində `data` `[]`-dir.
   *
   * Çağıran komponent dəqiq siqnalı bilirsə (məs. sorğunun
   * `dataUpdatedAt > 0` dəyəri — "ən azı bir dəfə uğurla yükləndi"), bu
   * prop-u ötürsün: `true` — uğurla yüklənib (boş nəticə olsa belə),
   * `false` — heç vaxt uğurla yüklənməyib. Ötürülməzsə (`undefined`), köhnə
   * `data.length > 0` fallback-i istifadə olunur — mövcud çağıranlara (bu
   * prop-u ötürməyənlərə) HEÇ BİR təsir etmir.
   */
  hasLoadedOnce?: boolean;
  emptyState?: { title: string; description?: string };
  /** Cədvəlin üstündəki alət zolağı (adətən `LocalTableSearch` + düymələr). */
  toolbar?: ReactNode;
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
  /**
   * FE#70 (AC-17) — uzun siyahılarda başlıq sətri (thead) görünən sahədə
   * sabit qalsın. Opt-in (defolt `false`) — mövcud səhifələrin görünüşünə
   * TƏSİR ETMİR. `true` verildikdə cədvəl bədəni daxili şaquli sürüşməyə
   * malik olur (`max-h-[70vh] overflow-y-auto`), `thead` isə həmin daxili
   * sürüşmə çərçivəsində `sticky top-0` ilə sabitlənir (səhifənin özü deyil,
   * cədvəlin öz daxili sahəsi sürüşür — AC-B1 ilə uyğun).
   */
  stickyHeader?: boolean;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  errorMessage = "Siyahı yüklənmədi",
  hasLoadedOnce,
  emptyState,
  toolbar,
  pageSize = 10,
  hidePagination = false,
  embedded = false,
  onRowClick,
  mobileCard,
  stickyHeader = false,
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

  const shellCls = embedded
    ? "rounded-none border-0 shadow-none bg-white"
    : "rounded-card border border-stone-200 bg-white shadow-card";

  // Xəta vəziyyəti «boş nəticə»dən ƏVVƏL yoxlanılır (F-44).
  //
  // FE#142: AMMA arxa-fon (background) refetch-i uğursuz olduqda `data`
  // TanStack Query-nin sənədləşdirilmiş davranışına görə ƏVVƏLKİ uğurlu
  // nəticəni saxlayır (undefined-ə sıfırlanmır) — yalnız `isError=true` olur.
  // Bu halda artıq göstəriləcək DOĞRU data mövcuddur, ona görə tam
  // `InlineError` ekranı ilə əvəz ETMİRİK: mövcud cədvəl/boş-siyahı vəziyyəti
  // qalır, üstündə yalnız kiçik "yenilənmə uğursuz oldu" xəbərdarlıq zolağı
  // göstərilir (aşağıda). Tam `InlineError` YALNIZ göstəriləcək data heç
  // uğurla yüklənməyibsə görünür — "heç olmadı" `hasLoadedOnce` prop-u ilə
  // (verilməyibsə köhnə `data.length === 0` proxy-si ilə) müəyyən edilir.
  const neverLoadedSuccessfully =
    hasLoadedOnce === undefined ? data.length === 0 : !hasLoadedOnce;

  if (isError && neverLoadedSuccessfully) {
    return (
      <div className={cn(toolbar && "space-y-3")}>
        {toolbar}
        <InlineError
          message={errorMessage}
          hint="Şəbəkə və ya server cavab vermədi."
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {toolbar}
        <div className={cn("overflow-hidden", shellCls)}>
          <TableSkeleton rows={5} columns={Math.min(columns.length || 4, 6)} />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    // FE#142: uğurla yüklənmiş (`hasLoadedOnce`) BOŞ siyahı + arxa-fon xətası
    // → tam `InlineError` YOX, `EmptyState` + üstündə kiçik xəbərdarlıq
    // zolağı — istifadəçi legitim boş nəticəni xəta ilə qarışdırmır.
    return (
      <div className={cn((toolbar || isError) && "space-y-3")}>
        {toolbar}
        {isError && <StaleDataBanner onRetry={onRetry} />}
        <EmptyState
          title={emptyState?.title ?? "Məlumat yoxdur"}
          hint={emptyState?.description}
          embedded={embedded}
        />
      </div>
    );
  }

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize: size } = table.getState().pagination;
  const total = data.length;
  const from = pageIndex * size + 1;
  const to = Math.min((pageIndex + 1) * size, total);

  return (
    <div className="space-y-3">
      {toolbar}

      {/* FE#142: arxa-fon refetch xətası — mövcud (köhnə/keçərli) data
          görünməyə davam edir, sadəcə üstündə xəbərdarlıq zolağı var. */}
      {isError && <StaleDataBanner onRetry={onRetry} />}

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
                  // rounded-control — mobil kartın küncləri ilə eyni: fokus
                  // halqası kartın kənarını təkrarlasın, kvadrat çıxmasın.
                  "focus-ring-inset cursor-pointer rounded-control",
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
          "overflow-x-auto",
          stickyHeader && "max-h-[70vh] overflow-y-auto",
          shellCls,
          mobileCard && "hidden md:block",
        )}
      >
        <table className="min-w-full divide-y divide-stone-200">
          <thead
            className={cn(
              "bg-stone-50",
              stickyHeader && "sticky top-0 z-10",
            )}
          >
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
                          className="focus-ring-inset inline-flex min-h-[40px] cursor-pointer select-none items-center gap-1 rounded-chip hover:text-stone-700"
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
                  onRowClick && "focus-ring-inset cursor-pointer",
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
        <TablePagination
          from={from}
          to={to}
          total={total}
          canPrevious={table.getCanPreviousPage()}
          canNext={table.getCanNextPage()}
          onPrevious={() => table.previousPage()}
          onNext={() => table.nextPage()}
        />
      )}
    </div>
  );
}
