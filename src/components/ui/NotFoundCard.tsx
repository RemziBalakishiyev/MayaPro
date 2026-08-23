import type { ReactNode } from "react";
import { PackageSearch, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export interface NotFoundCardProps {
  icon?: LucideIcon;
  title?: ReactNode;
  hint?: ReactNode;
  actions: ReactNode;
  className?: string;
}

/**
 * FE#189 — 404 / "tapılmadı" ailəsinin ortaq kart primitivi: böyük illüstrativ
 * ikon + "404" rəqəmi + başlıq + izah + əməliyyat düymələri. `notFoundComponent`
 * (root/admin) və resurs-səviyyəli EmptyState-lərlə eyni dizayn dilini paylaşır
 * (emerald/stone, kəskin jarqonsuz Azərbaycanca mətn).
 */
export function NotFoundCard({
  icon: Icon = PackageSearch,
  title = "Bu səhifə tapılmadı",
  hint = "Axtardığın səhifə silinib və ya ünvan səhv yazılıb.",
  actions,
  className,
}: NotFoundCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-full items-center justify-center bg-stone-100 p-4",
        className,
      )}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Icon size={30} aria-hidden />
        </div>
        <p
          aria-hidden="true"
          className="text-5xl font-extrabold tracking-tight text-stone-200"
        >
          404
        </p>
        <h1 className="mt-1 text-xl font-bold text-stone-900">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{hint}</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {actions}
        </div>
      </div>
    </div>
  );
}
