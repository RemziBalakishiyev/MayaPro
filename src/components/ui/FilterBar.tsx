import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";

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
  /**
   * FE#69 — axtarışsız rejim (köhnə `FilterPanel`-in yeganə fərqi bu idi).
   * `true` olduqda yalnız «Filterlər» toqqlu panel göstərilir.
   */
  hideSearch?: boolean;
}

/**
 * Vahid filter kartı — axtarış + filterlər panel birləşdir.
 *
 * Üst sətir: solda axtarış inputu (flex-1), sağda "Filterlər · N" toqql düyməsi (h-12 eyni).
 * Açılan panel: grid (lg:3 sütun, md:2, mobil:1), aralar gap-3.
 * Aktif filtrlər: panel bağlı olsa da kiçik çiplər göstər (× ilə silinir).
 * Panel altında: "Filterləri təmizlə" ghost düyməsi (yalnız aktif filter varsa).
 *
 * `TableToolbar` (`src/components/ui/TableToolbar.tsx`) ayrıca komponent kimi
 * mövcuddur (real istifadəsi: `src/routes/_app.musteriler.tsx`).
 * Bu `FilterBar` isə axtarış + filtr paneli funksionallığını `PeriodFilter`
 * (tarix aralığı) ilə birlikdə tutan, siyahı səhifələrində geniş istifadə
 * olunan primitivdir (FE#143 — istifadəsiz `PageToolbar` silinib, bu ikisi
 * həmin rolu faktiki oynayır).
 */
export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Bu siyahıda axtar...",
  searchAriaLabel = "Bu siyahıda axtar",
  activeCount,
  activeFilters = [],
  onRemoveFilter,
  children,
  onClear,
  clearLabel = "Filterləri təmizlə",
  label = "Filterlər",
  className,
  hideSearch = false,
}: FilterBarProps) {
  const panelId = useId();
  const [open, setOpen] = useState(() => activeCount > 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-control border border-stone-200 bg-stone-50/60",
        className,
      )}
    >
      {/* Üst sətir: axtarış + toqql düyməsi */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Axtarış — paylaşılan `LocalTableSearch` (AC-14) */}
        {!hideSearch && (
          <LocalTableSearch
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            ariaLabel={searchAriaLabel}
          />
        )}

        {/* Filterlər toqql düyməsi */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="focus-ring shrink-0 flex h-12 items-center justify-center gap-2 px-4 rounded-control border border-stone-300 bg-white text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
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
        // gap-y-4: X sil düyməsinin 40x40px hit-slop-u (inset-[-12px]) çipin
        // öz hündürlüyündən (24px) 8px böyükdür hər tərəfdən — sətirlər
        // arasında yalnız gap-2 (8px) olsaydı, iki üst-üstə sətirdəki
        // toxunma sahələri bir-birinə keçirdi (yanlış çipin silinməsi
        // riski). gap-y-4 (16px) bu üst-üstə düşməni aradan qaldırır.
        <div className="flex flex-wrap items-center gap-x-2 gap-y-4 px-3 py-2 border-t border-stone-200">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
            >
              <span>{filter.label}</span>
              {/* FE#99 — minimum 40x40px toxunma hədəfi (design-system.md §1.6,
                  AC-8/TC-6). Görünən "X" ikonu kompakt saxlanılır — `span`
                  yalnız orijinal ~16px izini (flow-dakı yerini) qoruyan
                  mövqeləndirmə lövbəridir, faktiki `<button>` isə
                  `absolute inset-[-12px]` ilə bu lövbərin ətrafında 40x40px-ə
                  qədər genişlənir (görünüş dəyişmir, yalnız toxunma/hover
                  sahəsi böyüyür). */}
              <span className="relative ml-0.5 inline-flex h-4 w-4 shrink-0">
                <button
                  type="button"
                  onClick={() => onRemoveFilter?.(filter.id)}
                  aria-label={`${filter.label} sil`}
                  title={`${filter.label} sil`}
                  className="focus-ring absolute inset-[-12px] inline-flex items-center justify-center rounded hover:bg-emerald-100"
                >
                  <X size={14} />
                </button>
              </span>
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
              className="focus-ring inline-flex min-h-[40px] items-center justify-center rounded-chip px-2 text-sm font-semibold text-stone-600 hover:text-emerald-700"
            >
              {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * FE#69 — dizayn sistemindəki standart adlar. Hər ikisi EYNİ komponentdir:
 * - `FilterPopover` — masaüstündə açılıb-bağlanan filtr paneli (mövcud naxış)
 * - `FilterDrawer`  — eyni filtr dəsti; gələcəkdə dar ekranda yandan açılan
 *   variant üçün ad ayrılıb (davranış hazırda eynidir).
 */
export const FilterPopover = FilterBar;
export const FilterDrawer = FilterBar;
export type FilterPopoverProps = FilterBarProps;
