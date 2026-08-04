import type { ReactNode } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  /**
   * Səhifənin TƏK əsas əməliyyatı (AC-13) — başlıqla eyni xətdə, sağda.
   * Burada `variant="primary"` Button gözlənilir.
   */
  primaryAction?: ReactNode;
  /** İkinci dərəcəli əməliyyatlar — `secondary`/`ghost` variantlı düymələr. */
  secondaryActions?: ReactNode;
  /** «Digər əməliyyatlar» menyusuna düşən bəndlər (AC-13). */
  moreActions?: ActionMenuItem[];
  /** Menyu düyməsinin mətni. */
  moreActionsLabel?: string;
  /**
   * @deprecated FE#69 — `primaryAction` / `secondaryActions` / `moreActions`
   * istifadə edin. Köhnə çağırışlar işləməyə davam edir (geriyə uyğunluq).
   */
  actions?: ReactNode;
  className?: string;
}

/**
 * FE#69 — VAHİD səhifə başlığı (AC-16).
 *
 * Standart: başlıq (h1) + alt yazı solda, əsas əməliyyat BAŞLIQLA EYNİ XƏTDƏ
 * sağda; ikinci dərəcəli əməliyyatlar onun solunda, qalanları «Digər
 * əməliyyatlar» menyusunda. Bütün route-larda eyni alt boşluq (`mb-6`).
 *
 * Bu komponent mövcud `PageHead`-in standartlaşdırılmış halıdır — `PageHead`
 * adı deprecated alias kimi saxlanılır (`components/layout/PageHead.tsx`).
 */
export function PageHeader({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  moreActions,
  moreActionsLabel = "Digər əməliyyatlar",
  actions,
  className,
}: PageHeaderProps) {
  const hasActions =
    Boolean(primaryAction) ||
    Boolean(secondaryActions) ||
    Boolean(actions) ||
    Boolean(moreActions?.length);

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold leading-tight text-stone-900 lg:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-base text-stone-500">{subtitle}</p>}
      </div>

      {hasActions && (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {actions}
          {secondaryActions}
          {moreActions && moreActions.length > 0 && (
            <ActionMenu
              items={moreActions}
              aria-label={moreActionsLabel}
              triggerLabel={moreActionsLabel}
            />
          )}
          {primaryAction}
        </div>
      )}
    </div>
  );
}
