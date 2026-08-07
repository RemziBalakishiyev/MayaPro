import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface ChartTableColumn {
  key: string;
  label: string;
  /** Say sütunları sağa düzülür (tabular-nums) — mətn sütunları sola. */
  numeric?: boolean;
}

export interface ChartDataTableProps {
  /** Ekran oxuyucusu üçün cədvəlin qısa təsviri (`<caption>`, `sr-only`). */
  caption: string;
  columns: ChartTableColumn[];
  rows: Record<string, ReactNode>[];
  className?: string;
}

/**
 * FE#78 (bənd #12) — hər chartın altında yığılan (collapsed) "Cədvəl kimi
 * bax" açılışı: EYNİ datanın sadə HTML cədvəli. Ekran oxuyucusu istifadəçisi
 * (chart-lar `aria-hidden`/decorative olduğu üçün SVG-dən rəqəmi oxuya
 * bilmir) və dəqiq rəqəmi görmək istəyən istifadəçi üçün əlçatan alternativ.
 *
 * Yeni analitika YOXDUR — `rows` çağıran tərəfin artıq göstərdiyi chart
 * data-sının həmin (fmtMoney formatlı) təqdimatıdır.
 */
export function ChartDataTable({
  caption,
  columns,
  rows,
  className,
}: ChartDataTableProps) {
  if (rows.length === 0) return null;
  return (
    <details className={`group mt-3 rounded-lg border border-stone-200 ${className ?? ""}`}>
      <summary className="focus-ring-inset flex min-h-[40px] cursor-pointer select-none items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-stone-600 [&::-webkit-details-marker]:hidden hover:bg-stone-50">
        <ChevronRight
          size={14}
          aria-hidden
          className="shrink-0 transition-transform group-open:rotate-90"
        />
        Cədvəl kimi bax
      </summary>
      <div className="max-h-64 overflow-auto border-t border-stone-100 p-2">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className="whitespace-nowrap px-2 py-1.5 font-semibold text-stone-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-stone-100">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-2 py-1.5 text-stone-700 ${
                      c.numeric ? "text-right tabular-nums" : ""
                    }`}
                  >
                    {r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
