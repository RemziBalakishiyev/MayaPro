import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Status → rəng (MVP ilə eyni). */
export const STATUS_STYLE: Record<string, string> = {
  "Stokda var": "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Azalır: "bg-amber-100 text-amber-800 ring-amber-200",
  Bitib: "bg-red-100 text-red-700 ring-red-200",
  Satılmır: "bg-sky-100 text-sky-800 ring-sky-200",
  "Ziyana satılır": "bg-rose-100 text-rose-800 ring-rose-200",
  Aktiv: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Deaktiv: "bg-stone-200 text-stone-600 ring-stone-300",
  Nağd: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Kart: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  Nisyə: "bg-amber-100 text-amber-800 ring-amber-200",
  Borclu: "bg-red-100 text-red-700 ring-red-200",
  Ödənilib: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const FALLBACK = "bg-stone-100 text-stone-700 ring-stone-200";

export interface BadgeProps {
  children: ReactNode;
  /** Rəng açarı; verilməzsə children mətni açar kimi istifadə olunur. */
  tone?: string;
  className?: string;
}

export function Badge({ children, tone, className }: BadgeProps) {
  const key = tone ?? (typeof children === "string" ? children : "");
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-semibold ring-1 ring-inset",
        STATUS_STYLE[key] ?? FALLBACK,
        className,
      )}
    >
      {children}
    </span>
  );
}
