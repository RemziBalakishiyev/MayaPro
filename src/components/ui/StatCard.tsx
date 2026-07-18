import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type StatTone = "default" | "green" | "red" | "amber" | "indigo";

const TONE: Record<StatTone, string> = {
  default: "text-stone-900",
  green: "text-emerald-700",
  red: "text-red-600",
  amber: "text-amber-600",
  indigo: "text-indigo-600",
};

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-stone-500">{label}</span>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
            <Icon size={18} />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums whitespace-nowrap leading-tight lg:text-3xl",
          TONE[tone],
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
    </div>
  );
}
