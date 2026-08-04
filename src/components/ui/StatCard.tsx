import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * FE#69 — semantik tonlar (AC-11).
 * `green` uğur/müsbət maliyyə · `amber` xəbərdarlıq (azalan stok, gecikmiş
 * borc, KASSA FƏRQİ) · `red` ziyan/kritik · `indigo` neytral məlumat.
 * Köhnə ad dəsti dəyişməyib — mövcud çağırışlar işləməyə davam edir.
 */
export type StatTone = "default" | "green" | "red" | "amber" | "indigo";

const TONE: Record<StatTone, string> = {
  default: "text-stone-900",
  green: "text-emerald-700",
  red: "text-red-600",
  amber: "text-amber-700",
  indigo: "text-indigo-600",
};

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  /**
   * FE#69 — dəyərin hover izahı (tam məbləğ). Verilməzsə və `value` sətir/rəqəm
   * olarsa avtomatik onun özü işlədilir (R-04).
   */
  valueTitle?: string;
  /** Dəyərin yanında göstərilən ikon — rəng yeganə siqnal olmasın (AC-10). */
  valueIcon?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  valueTitle,
  valueIcon,
  className,
}: StatCardProps) {
  const autoTitle =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : undefined;

  return (
    <div
      className={cn(
        "min-w-0 rounded-card border border-stone-200 bg-white p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold text-stone-500">
          {label}
        </span>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-stone-100 text-stone-500">
            <Icon size={18} aria-hidden />
          </span>
        )}
      </div>
      <p
        title={valueTitle ?? autoTitle}
        className={cn(
          "mt-2 flex items-center gap-1.5 text-2xl font-bold leading-tight lg:text-3xl",
          TONE[tone],
        )}
      >
        {valueIcon}
        {/* `money`: tabular-nums + min-w-0 + truncate (R-04) */}
        <span className="money">{value}</span>
      </p>
      {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
    </div>
  );
}
