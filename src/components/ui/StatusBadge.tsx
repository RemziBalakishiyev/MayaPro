import type { ReactNode } from "react";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Circle,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "./Badge";
import type { SemanticTone } from "@/lib/ui-tokens";

const TONE_STYLE: Record<SemanticTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  warning: "bg-amber-50 text-amber-900 ring-amber-300/80",
  danger: "bg-red-50 text-red-700 ring-red-200/80",
  info: "bg-sky-50 text-sky-800 ring-sky-200/80",
  neutral: "bg-stone-100 text-stone-700 ring-stone-200/80",
};

const TONE_ICON: Record<SemanticTone, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: Ban,
  info: Info,
  neutral: Circle,
};

export interface StatusBadgeProps {
  children: ReactNode;
  /**
   * Semantik ton (AC-11):
   * success — uğur/müsbət maliyyə · warning — xəbərdarlıq, azalan stok,
   * gecikmiş borc, KASSA FƏRQİ · danger — ziyan/kritik · info — neytral
   * məlumat · neutral — statussuz.
   */
  tone: SemanticTone;
  /** İkonu gizlətmək üçün (yalnız rəngin kifayət etdiyi sıx kontekstlərdə YOX). */
  showIcon?: boolean;
  /** Tonun ikonunu əvəz etmək üçün. */
  icon?: LucideIcon;
  /** Hover izahı. */
  title?: string;
  className?: string;
}

/**
 * FE#69 — semantik status nişanı (AC-10).
 *
 * `Badge`-dən fərqi: rəng MƏTN AÇARINDAN deyil, açıq semantik tondan gəlir və
 * hər nişanda ikon + mətn birlikdə olur — yəni rəng heç vaxt YEGANƏ status
 * göstəricisi deyil (qrayskeyl rejimdə də oxunur).
 *
 * Mövcud `Badge` komponenti SİLİNMİR və dəyişmir — mətn açarlı köhnə
 * çağırışlar işləməyə davam edir.
 */
export function StatusBadge({
  children,
  tone,
  showIcon = true,
  icon,
  title,
  className,
}: StatusBadgeProps) {
  const Icon = icon ?? TONE_ICON[tone];
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-tag px-2 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset",
        TONE_STYLE[tone],
        className,
      )}
    >
      {showIcon && <Icon size={12} aria-hidden className="shrink-0" />}
      {children}
    </span>
  );
}

export { Badge };
