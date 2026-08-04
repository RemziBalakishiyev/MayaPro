import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "warn";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Semantik rəng qaydası (FE#69 / AC-11):
 * - `primary`   → yaşıl: səhifənin ƏSAS brend əməliyyatı (səhifədə BİR ədəd)
 * - `secondary` → neytral: ikinci dərəcəli əməliyyatlar
 * - `ghost`     → çərçivəsiz: üçüncü dərəcəli / sıx kontekst
 * - `warn`      → kəhrəba: xəbərdarlıq tələb edən, lakin dağıdıcı OLMAYAN
 * - `danger`    → qırmızı: dağıdıcı (sil, ləğv et) əməliyyat
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 active:bg-emerald-900",
  secondary:
    "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 active:bg-stone-100",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost: "text-stone-700 hover:bg-stone-100 active:bg-stone-200",
  warn: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
};

/**
 * Ölçülər (AC-8): bütün variantlar ≥40px, defolt `md` 44px toxunma hədəfidir.
 * Radius vahid şkaladandır (`control` = 12px, `chip` = 8px).
 */
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[40px] px-3.5 text-sm rounded-chip gap-1.5",
  md: "min-h-[44px] px-5 text-base rounded-control gap-2",
  lg: "min-h-[52px] px-6 text-base rounded-control gap-2",
};

const SPINNER_SIZE: Record<ButtonSize, number> = { sm: 14, md: 16, lg: 18 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mətndən əvvəl göstərilən ikon (məs. <Plus size={16} />) */
  icon?: ReactNode;
  /**
   * Gözləmə vəziyyəti (FE#69 / F-42): ikonun yerində fırlanan göstərici,
   * düymə avtomatik `disabled` + `aria-busy` olur — təkrar klik mümkün deyil.
   * Əl ilə yazılmış `Loader2` naxışını əvəz edir.
   */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      className,
      disabled,
      ...rest
    },
    ref,
  ) => (
    <button
      ref={ref}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors",
        // Vahid fokus tokeni (R-15) — bütün primitivlərdə eyni halqa
        "focus-ring",
        // Basma hissi: yalnız rəng deyil, incə miqyas dəyişikliyi də var
        "active:scale-[0.99]",
        // Deaktiv: səbəb çağıran tərəfdən `title` ilə verilir
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {loading ? (
        <Loader2
          size={SPINNER_SIZE[size]}
          className="shrink-0 animate-spin"
          aria-hidden
        />
      ) : (
        icon
      )}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
