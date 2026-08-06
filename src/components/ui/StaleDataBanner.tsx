import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StaleDataBannerProps {
  /** Qısa, Azərbaycanca izah. */
  message?: ReactNode;
  /** «Yenidən» düyməsi — verilərsə göstərilir. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * FE#142 — arxa-fon (background) refetch xətası ÜÇÜN incə xəbərdarlıq zolağı.
 *
 * `InlineError`-dan fərqli olaraq artıq uğurla göstərilən DOĞRU datanı ƏVƏZ
 * ETMİR — yalnız onun ÜSTÜNDƏ göstərilir. İstifadə ssenarisi: sorğu əvvəl
 * uğurla yükləndikdən sonra arxa-fon refetch-i uğursuz olur (`isError=true`),
 * amma TanStack Query `data` sahəsini ƏVVƏLKİ uğurlu nəticə ilə saxlayır — bu
 * halda tam `InlineError` ekranı ƏVƏZİNƏ bu kiçik zolaq göstərilməlidir ki,
 * istifadəçi artıq gördüyü keçərli məlumatı itirməsin.
 */
export function StaleDataBanner({
  message = "Yenilənmə uğursuz oldu — göstərilən məlumat köhnəlmiş ola bilər.",
  onRetry,
  retryLabel = "Yenidən",
  className,
}: StaleDataBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-2 rounded-card border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          size={16}
          aria-hidden
          className="shrink-0 text-amber-600"
        />
        <p className="font-semibold text-amber-800">{message}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring inline-flex min-h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-chip bg-white px-3.5 text-sm font-semibold text-amber-800 ring-1 ring-amber-300 transition-colors hover:bg-amber-100 active:scale-[0.98]"
        >
          <RefreshCw size={14} aria-hidden />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
