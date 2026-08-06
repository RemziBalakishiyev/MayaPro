import { useId } from "react";
import { Search, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/cn";

export interface GlobalProductSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** `Enter` basıldıqda — mövcud naviqasiya davranışı (dəyişmir). */
  onSubmit: () => void;
  /** Enter-in hara apardığını bildirən ipucu (defolt: «Mallar»). */
  targetLabel?: string;
  className?: string;
}

/**
 * FE#69 — QLOBAL mal axtarışı (topbar). Səhifədaxili `LocalTableSearch`-dən
 * həm YERİ (üst zolaq), həm GÖRÜNÜŞÜ (yumru, dolu fon), həm də PLACEHOLDER
 * mətni ilə fərqlənir (AC-14 / R-17).
 *
 * `Enter` istifadəçini başqa səhifəyə (Mallar) aparır — bu, input daxilindəki
 * görünən ipucu və `aria-describedby` ilə əvvəlcədən bildirilir.
 */
export function GlobalProductSearch({
  value,
  onChange,
  onSubmit,
  targetLabel = "Mallar",
  className,
}: GlobalProductSearchProps) {
  const hintId = useId();

  return (
    <div className={cn("relative hidden max-w-md flex-1 sm:block", className)}>
      <Search
        size={18}
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-500"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        aria-label="Bütün sistemdə mal axtar"
        aria-describedby={hintId}
        placeholder="Bütün sistemdə mal axtar..."
        className={cn(
          // Qlobal axtarış: YUMRU və dolu fonlu — lokal cədvəl axtarışı isə
          // düzbucaqlı, ağ fonlu və kart daxilindədir.
          "h-11 w-full rounded-full border border-stone-300 bg-stone-100 pl-11 pr-28 text-base",
          "outline-none transition-shadow placeholder:text-stone-500",
          "focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/20",
        )}
      />
      <span
        id={hintId}
        className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-300 md:inline-flex"
      >
        <CornerDownLeft size={12} aria-hidden />
        {targetLabel} səhifəsi
      </span>
    </div>
  );
}
