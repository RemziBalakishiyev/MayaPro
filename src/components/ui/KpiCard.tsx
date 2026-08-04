import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export interface KpiCardProps {
  label: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  /** Dövrdən asılı olmayan (anlıq) sahələr üçün kiçik qeyd, məs. "hazırda". */
  note?: ReactNode;
  tone?: "default" | "amber";
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * KPI kartı — Mallar/Satış/Nisyə Borclar səhifələrindəki dövr üzrə kartlar
 * üçün ortaq görünüş (FE#56). Hər kart öz skeleton/error vəziyyətini idarə
 * edir (AC25) — bir kartın sorğusu uğursuz olsa belə digərləri və səhifənin
 * qalan hissəsi işləməyə davam edir.
 */
export function KpiCard({
  label,
  value,
  sub,
  note,
  tone = "default",
  isLoading,
  isError,
  onRetry,
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-card",
        tone === "amber"
          ? "border-amber-300 bg-amber-50"
          : "border-stone-200 bg-white",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </span>
        {note && (
          <span
            title="Dövr seçimindən asılı deyil — anlıq dəyər"
            className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-500"
          >
            {note}
          </span>
        )}
      </div>

      {isError ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-red-600">Yüklənmədi</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw size={12} />
              Yenidən
            </button>
          )}
        </div>
      ) : isLoading ? (
        <div className="mt-2 space-y-1.5">
          <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
        </div>
      ) : (
        <>
          <p
            className={cn(
              "mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight lg:text-2xl",
              tone === "amber" ? "text-amber-700" : "text-stone-900",
            )}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
        </>
      )}
    </div>
  );
}
