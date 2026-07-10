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
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </span>
        {Icon && <Icon size={16} className="text-stone-400" />}
      </div>
      <p className={cn("mt-1.5 text-xl font-bold tabular-nums", TONE[tone])}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}
