import type { ReactNode } from "react";
import { Package, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  /**
   * FE#69 — xarici kartın/cədvəlin İÇİNDƏ göstərilir: kəsikli çərçivə və fon
   * verilmir ki, iç-içə çərçivə (kart içində kart) yaranmasın (AC-6).
   */
  embedded?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  hint,
  action,
  embedded = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        embedded
          ? "py-10"
          : "rounded-card border border-dashed border-stone-300 bg-stone-50 py-12",
        className,
      )}
    >
      <div className="mb-3 rounded-full bg-stone-200 p-4 text-stone-500">
        <Icon size={26} aria-hidden />
      </div>
      <p className="text-base font-bold text-stone-700">{title}</p>
      {hint && <p className="mt-1.5 max-w-xs text-sm text-stone-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
