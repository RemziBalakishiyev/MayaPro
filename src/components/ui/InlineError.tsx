import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InlineErrorProps {
  /** Qısa, Azərbaycanca izah — «boş nəticə» ilə qarışmamalıdır. */
  message?: ReactNode;
  /** Əlavə izah / texniki detal. */
  hint?: ReactNode;
  /** «Yenidən» düyməsi — verilərsə göstərilir. */
  onRetry?: () => void;
  retryLabel?: string;
  /** Kart daxilində istifadə: öz çərçivəsi olmadan (iç-içə çərçivə olmasın). */
  embedded?: boolean;
  className?: string;
}

/**
 * FE#69 — VAHİD xəta vəziyyəti (F-44 / AC-10).
 *
 * Rəng yeganə siqnal deyil: xəbərdarlıq ikonu + açıq mətn birlikdə verilir,
 * `role="alert"` ilə ekran oxuyucusuna elan olunur. Şəbəkə xətası heç vaxt
 * «boş siyahı» kimi göstərilmir.
 */
export function InlineError({
  message = "Məlumat yüklənmədi",
  hint,
  onRetry,
  retryLabel = "Yenidən",
  embedded = false,
  className,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        embedded
          ? "px-1 py-3"
          : "rounded-card border border-red-200 bg-red-50 px-4 py-3.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertTriangle
          size={18}
          aria-hidden
          className="mt-0.5 shrink-0 text-red-600"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-700">{message}</p>
          {hint && <p className="mt-0.5 text-sm text-stone-600">{hint}</p>}
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-chip bg-white px-3.5 text-sm font-semibold text-red-700 ring-1 ring-red-300 transition-colors hover:bg-red-100 active:scale-[0.98]"
        >
          <RefreshCw size={14} aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
