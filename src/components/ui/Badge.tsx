import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Status → rəng (sakit, cədvəl üçün uyğun). */
export const STATUS_STYLE: Record<string, string> = {
  "Stokda var": "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  Azalır: "bg-amber-50 text-amber-800 ring-amber-200/70",
  Bitib: "bg-red-50 text-red-700 ring-red-200/70",
  Satılmır: "bg-sky-50 text-sky-700 ring-sky-200/70",
  "Ziyana satılır": "bg-rose-50 text-rose-700 ring-rose-200/70",
  Aktiv: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  Deaktiv: "bg-stone-100 text-stone-500 ring-stone-200/80",
  Nağd: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  Kart: "bg-sky-50 text-sky-700 ring-sky-200/70",
  Nisyə: "bg-orange-50 text-orange-800 ring-orange-200/70",
  Sərbəst: "bg-stone-100 text-stone-600 ring-stone-200/80",
  Borclu: "bg-red-50 text-red-700 ring-red-200/70",
  Ödənilib: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
  /** Xərc mənbəyi (Xərclər cədvəli): Ümumi — boz, Mala bağlı — yaşıl. */
  Ümumi: "bg-stone-100 text-stone-600 ring-stone-200/80",
  "Mala bağlı": "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
};

const FALLBACK = "bg-stone-50 text-stone-600 ring-stone-200/80";

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
        "inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium tracking-wide ring-1 ring-inset",
        STATUS_STYLE[key] ?? FALLBACK,
        className,
      )}
    >
      {children}
    </span>
  );
}
