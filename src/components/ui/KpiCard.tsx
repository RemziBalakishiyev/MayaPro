import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export interface KpiCardProps {
  label: ReactNode;
  value?: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "amber";
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Tək dəyərli KPI kartı — label üstdə, böyük rəqəm altda, opsional alt sətir
 * (FE#61). Hər kart öz skeleton/error vəziyyətini idarə edir: bir sorğu
 * uğursuz olsa belə səhifənin qalan hissəsi işləməyə davam edir.
 */
export function KpiCard({
  label,
  value,
  sub,
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
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </span>

      {isError ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-red-600">Yüklənmədi</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
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

export interface StatClusterItem {
  key: string;
  label: ReactNode;
  value?: ReactNode;
  /** Dəyərin altında kiçik əlavə qeyd (məs. xəbərdarlıq mətni). */
  sub?: ReactNode;
}

export interface StatClusterProps {
  items: StatClusterItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
}

/**
 * Bir neçə əlaqəli rəqəmi TƏK panel daxilində, incə ayırıcılarla yan-yana
 * göstərir — hər rəqəm üçün ayrıca kart karkası (border/shadow) YOX (FE#61).
 * Mobil ölçüdə sətirlər şaquli yığılır (`divide-y`), `sm`-dən etibarən üfüqi
 * sıra + `divide-x` ayırıcıya keçir. Panel özü tək skeleton/error vəziyyəti
 * paylaşır — bütün `items` eyni sorğudan gəldiyi üçün bu, məlumat itkisi
 * demək deyil.
 */
export function StatCluster({
  items,
  isLoading,
  isError,
  onRetry,
  className,
}: StatClusterProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-4 shadow-card",
        className,
      )}
    >
      {isError ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-red-600">Yüklənmədi</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw size={12} />
              Yenidən
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-stone-100 sm:flex-row sm:divide-x sm:divide-y-0">
          {items.map((item) => (
            <div
              key={item.key}
              className="py-2.5 first:pt-0 last:pb-0 sm:flex-1 sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                {item.label}
              </span>
              {isLoading ? (
                <div className="mt-1.5 h-6 w-2/3 animate-pulse rounded bg-stone-200" />
              ) : (
                <>
                  <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-stone-900 lg:text-2xl">
                    {item.value}
                  </p>
                  {item.sub && (
                    <p className="mt-0.5 text-xs text-stone-500">
                      {item.sub}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface AlertPillProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * Yığcam, kliklənə bilən xəbərdarlıq çipi (FE#61) — ayrıca "qışqıran" kart
 * əvəzinə, tək önəmli siqnalı (məs. azalan mal sayı) status filtrinə keçidlə
 * birləşdirir. Basılanda `active:scale-[0.98]` ilə toxunma hissi verir.
 */
export function AlertPill({ children, onClick, className }: AlertPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 active:scale-[0.98]",
        className,
      )}
    >
      {children}
    </button>
  );
}
