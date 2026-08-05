import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface InlineErrorProps {
  /** Qısa, Azərbaycanca izah — «boş nəticə» ilə qarışmamalıdır. */
  message?: ReactNode;
  /** Əlavə izah / texniki detal. */
  hint?: ReactNode;
  /** «Yenidən cəhd et» düyməsi — verilərsə göstərilir. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * FE#127 (TC-32) — VAHİD şəbəkə/server xətası vəziyyəti.
 *
 * Rəng yeganə siqnal deyil: xəbərdarlıq ikonu + açıq mətn birlikdə verilir,
 * `role="alert"` ilə ekran oxuyucusuna elan olunur. Şəbəkə xətası heç vaxt
 * sonsuz spinner və ya «boş siyahı» kimi göstərilmir.
 */
export function InlineError({
  message = "Məlumat yüklənmədi",
  hint,
  onRetry,
  retryLabel = "Yenidən cəhd et",
  className,
}: InlineErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <AlertTriangle
          size={20}
          aria-hidden
          className="shrink-0 text-red-600"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-red-700">{message}</p>
          {hint && <p className="mt-0.5 text-sm text-red-600/80">{hint}</p>}
        </div>
      </div>

      {onRetry && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} aria-hidden />}
          onClick={onRetry}
        >
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
