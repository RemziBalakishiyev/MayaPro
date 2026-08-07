import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, Check } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { TONE_TEXT } from "@/lib/ui-tokens";
import { fmtMoney, fmtMoneySigned, fmtDate } from "@/lib/format";
import { cashDiffPresentation } from "./cash-diff-presentation";
import { useClosings } from "../queries";
import type { Closing } from "@/types";

export function ClosingHistory() {
  const {
    data: closings = [],
    isLoading,
    isError,
    dataUpdatedAt,
    refetch,
  } = useClosings();
  // FE#142: sorğu ən azı bir dəfə uğurla yüklənibmi — arxa-fon refetch
  // xətasında `DataTable`-ın "heç vaxt yüklənməyib" ilə "uğurla yüklənmiş
  // BOŞ siyahı" hallarını ayırd etməsi üçün (maliyyə-həssas ekran).
  const hasLoadedOnce = dataUpdatedAt > 0 || closings.length > 0;

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
        // FE#81 (AC-9b): xərc normal əməliyyatdır, xəta/ziyan deyil —
        // `text-red-600` çıxarıldı (DS §1.8; Xərclər səhifəsində eyni qayda
        // FE#76 ilə tətbiq olunub). Sütun başlığı kontekst üçün kifayətdir.
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        // FE#77 (E-22): "Gözlənilən" → "Olmalı idi" — mühasibat termini
        // əvəzinə sadə bazar dili (`docs/ui-terminology.md`).
        accessorKey: "expectedCash",
        header: "Olmalı idi",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        // FE#77 (E-22): "Faktiki" → "Sayıldı".
        accessorKey: "actualCash",
        header: "Sayıldı",
        cell: ({ getValue }) => (
          <span className="tabular-nums">{fmtMoney(getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "difference",
        header: "Fərq",
        cell: ({ getValue }) => {
          const d = getValue() as number;
          /*
           * FE#69 (AC-12 / R-02): müsbət fərq yaşıl «uğur» deyil — kəhrəba
           * «yoxlanmalı uyğunsuzluq»dur. Rəng yeganə siqnal olmasın deyə
           * xəbərdarlıq ikonu və `title` izahı da verilir.
           */
          const p = cashDiffPresentation(d);
          return (
            <span
              title={p.title}
              className={`inline-flex items-center gap-1 font-bold tabular-nums ${TONE_TEXT[p.tone]}`}
            >
              {p.showWarningIcon ? (
                <AlertTriangle size={14} aria-hidden className="shrink-0" />
              ) : (
                <Check size={14} aria-hidden className="shrink-0" />
              )}
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
      hasLoadedOnce={hasLoadedOnce}
      errorMessage="Bağlanış tarixçəsi yüklənmədi"
      emptyState={{ title: "Bağlanış yoxdur" }}
    />
  );
}
