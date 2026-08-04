import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputCls } from "./Input";

export interface LocalTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Defolt mətn qlobal axtarışdan fərqlidir (AC-14). */
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * FE#69 — LOKAL cədvəl axtarışı (AC-14 / R-17).
 *
 * Yalnız EKRANDAKI siyahını süzür (naviqasiya etmir). Topbar-dakı
 * `GlobalProductSearch`-dən fərqi:
 * - yeri: səhifə/cədvəl daxilində, filtr zolağında
 * - görünüşü: düzbucaqlı (`rounded-control`), ağ fon
 * - mətni: «Bu siyahıda axtar...»
 */
export function LocalTableSearch({
  value,
  onChange,
  placeholder = "Bu siyahıda axtar...",
  ariaLabel = "Bu siyahıda axtar",
  className,
}: LocalTableSearchProps) {
  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(inputCls, "pl-10", value && "pr-11")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Axtarışı təmizlə"
          title="Axtarışı təmizlə"
          className="focus-ring absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-chip text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
