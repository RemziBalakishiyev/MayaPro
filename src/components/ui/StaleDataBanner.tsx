import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface StaleDataBannerProps {
  /** Qısa, Azərbaycanca izah. */
  message?: ReactNode;
  /** «Yenidən cəhd et» düyməsi — verilərsə göstərilir. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * FE#134 — arxa-fon (background) refetch xətası ÜÇÜN incə xəbərdarlıq zolağı.
 *
 * `InlineError`-dan fərqli olaraq mövcud DOĞRU datanı ƏVƏZ ETMİR — yalnız
 * onun ÜSTÜNDƏ göstərilir. İstifadə ssenarisi: sorğu əvvəl uğurla
 * yükləndikdən sonra arxa-fon refetch-i uğursuz olur (`isError=true`), amma
 * TanStack Query `data` sahəsini ƏVVƏLKİ uğurlu nəticə ilə saxlayır — bu
 * halda tam `InlineError` ekranı ƏVƏZİNƏ bu kiçik zolaq göstərilməlidir ki,
 * istifadəçi artıq gördüyü keçərli məlumatı itirməsin.
 */
export function StaleDataBanner({
  message = "Yenilənmə uğursuz oldu — göstərilən məlumat köhnəlmiş ola bilər.",
  onRetry,
  retryLabel = "Yenidən cəhd et",
  className,
}: StaleDataBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between",
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
