import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconButtonTone = "neutral" | "primary" | "danger";
export type IconButtonSize = "sm" | "md";

const TONE: Record<IconButtonTone, string> = {
  neutral:
    "text-stone-500 hover:bg-stone-100 hover:text-stone-800 active:bg-stone-200",
  primary:
    "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 active:bg-emerald-100",
  danger: "text-red-600 hover:bg-red-50 hover:text-red-700 active:bg-red-100",
};

/** AC-8: hər iki ölçü ≥40px, `md` 44px toxunma hədəfidir. */
const SIZE: Record<IconButtonSize, string> = {
  sm: "h-10 w-10 rounded-chip",
  md: "h-11 w-11 rounded-control",
};

export interface IconButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-label" | "title" | "children"
  > {
  /**
   * MƏCBURİ. Həm `aria-label`, həm də tooltip (`title`) kimi işlədilir —
   * FE#69 qaydası: izahsız yalnız-ikon düymə OLMAZ (AC-15).
   * Bu prop verilmədikdə TypeScript kompilyasiya xətası verir.
   */
  label: string;
  /** Tooltip mətni `label`-dan fərqli olmalıdırsa (məs. səbəb izahı). */
  tooltip?: string;
  icon: ReactNode;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  loading?: boolean;
}

/**
 * Yalnız-ikon düymə — `label` MƏCBURİ olduğu üçün heç vaxt izahsız qala bilmir.
 *
 * DİQQƏT: kritik/dağıdıcı əməliyyatlar (sil, günü bağla, ödəniş təsdiqi,
 * ziyana satış) yalnız-ikon düymə ilə TƏQDİM OLUNMUR — orada mətn etiketli
 * `Button` istifadə edilir. `IconButton` bağla/kopyala/genişlət kimi köməkçi
 * əməliyyatlar üçündür.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      label,
      tooltip,
      icon,
      tone = "neutral",
      size = "md",
      loading = false,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      type="button"
      {...rest}
      aria-label={label}
      title={tooltip ?? label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-colors",
        "focus-ring active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" aria-hidden />
      ) : (
        icon
      )}
    </button>
  ),
);
IconButton.displayName = "IconButton";
