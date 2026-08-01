import { useId, useState } from "react";
import type { ReactNode } from "react";
import { Search, ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputCls } from "@/components/ui/Input";

export interface FilterBarProps {
  /** Axtarış dəyəri */
  searchValue: string;
  /** Axtarış dəyişdikdə çağrılır */
  onSearchChange: (value: string) => void;
  /** Axtarış placeholder-ı */
  searchPlaceholder?: string;
  /** Axtarış aria-label-ı */
  searchAriaLabel?: string;
  /** Aktiv (panel içindəki) filtrlər sayı */
  activeCount: number;
  /** Aktiv filtrlər — çiplər sırasında göstərilir. Hər çip (label, id) təşkil edir */
  activeFilters?: Array<{ id: string; label: string }>;
  /** Çipdəki X-ə kliklənəndə çağrılır (filter id ilə) */
  onRemoveFilter?: (filterId: string) => void;
  /** Filterlər paneli məzmunu */
  children?: ReactNode;
  /** "Filterləri təmizlə" düyməsinə kliklənəndə */
  onClear?: () => void;
  /** "Filterləri təmizlə" düyməsinin mətni */
  clearLabel?: string;
  /** Filterlər düyməsinin başlığı */
  label?: string;
  /** Xarici yerləşdirmə class-ları */
  className?: string;
}

/**
 * Vahid filter kartı — axtarış + filterlər panel birləşdir.
 *
 * Üst sətir: solda axtarış inputu (flex-1), sağda "Filterlər · N" toqql düyməsi (h-12 eyni).
 * Açılan panel: grid (lg:3 sütun, md:2, mobil:1), aralar gap-3.
 * Aktif filtrlər: panel bağlı olsa da kiçik çiplər göstər (× ilə silinir).
 * Panel altında: "Filterləri təmizlə" ghost düyməsi (yalnız aktif filter varsa).
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Axtar...",
  searchAriaLabel = "Axtar",
  activeCount,
  activeFilters = [],
  onRemoveFilter,
  children,
  onClear,
  clearLabel = "Filterləri təmizlə",
  label = "Filterlər",
  className,
}: FilterBarProps) {
  const panelId = useId();
  const [open, setOpen] = useState(() => activeCount > 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60",
        className,
      )}
    >
      {/* Üst sətir: axtarış + toqql düyməsi */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Axtarış inputu */}
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchAriaLabel}
            placeholder={searchPlaceholder}
            className={cn(inputCls, "h-12 pl-8 text-sm")}
          />
        </div>

        {/* Filterlər toqql düyməsi */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="shrink-0 flex h-12 items-center justify-center gap-2 px-4 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
        >
          <SlidersHorizontal size={16} className="text-stone-500" />
          {label}
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-stone-400 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Aktif filtrlər çiplər sırasında (panel bağlı olsa da görünsün) */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-stone-200">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
            >
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter?.(filter.id)}
                aria-label={`${filter.label} sil`}
                className="ml-0.5 inline-flex items-center justify-center rounded hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Açılan panel */}
      <div
        id={panelId}
        hidden={!open}
        className="border-t border-stone-200 px-3 py-3"
      >
        {/* Children-i olduğu kimi yerləşdir (grid-i çevrədən verə bilərlər) */}
        {children}

        {/* Filterləri təmizlə düyməsi */}
        {activeCount > 0 && onClear && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-semibold text-stone-500 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600 rounded px-2 py-1"
            >
              {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
