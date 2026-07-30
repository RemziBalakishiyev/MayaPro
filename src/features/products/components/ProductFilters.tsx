import { Search } from "lucide-react";
import { FilterPanel } from "@/components/ui/FilterPanel";
import { Select } from "@/components/ui/Select";
import { inputCls } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { ProductStatus } from "@/types";

export interface ProductFilterValues {
  q?: string;
  cat?: string;
  status?: ProductStatus;
  loc?: string;
}

const STATUSES: ProductStatus[] = [
  "Stokda var",
  "Azalır",
  "Bitib",
  "Satılmır",
  "Ziyana satılır",
];

interface Props {
  value: ProductFilterValues;
  categories: string[];
  locations: string[];
  onChange: (patch: ProductFilterValues) => void;
}

/**
 * Mal filtrləri — dəyərlər URL search params-da saxlanılır.
 * Axtarış həmişə görünür, qalan filterlər yığcam "Filterlər" panelində
 * (satış jurnalı ilə eyni naxış).
 */
export function ProductFilters({
  value,
  categories,
  locations,
  onChange,
}: Props) {
  // Axtarış inputu həmişə göründüyü üçün badge yalnız panel içindəki
  // filterləri sayır.
  const activeFilterCount = [!!value.cat, !!value.status, !!value.loc].filter(
    Boolean,
  ).length;

  const clearFilters = () =>
    onChange({ cat: undefined, status: undefined, loc: undefined });

  return (
    <div className="mb-4 flex flex-wrap items-stretch gap-2">
      <div className="relative w-full sm:w-64">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={value.q ?? ""}
          onChange={(e) => onChange({ q: e.target.value || undefined })}
          aria-label="Mal axtar"
          placeholder="Ad, kateqoriya, xüsusiyyət üzrə axtar..."
          className={cn(inputCls, "h-9 pl-8 text-sm")}
        />
      </div>

      <FilterPanel
        className="min-w-0 flex-1"
        activeCount={activeFilterCount}
        onClear={clearFilters}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">
              Kateqoriya
            </label>
            <Select
              aria-label="Kateqoriya"
              value={value.cat ?? ""}
              onChange={(e) => onChange({ cat: e.target.value || undefined })}
              className="h-9 w-full text-sm"
            >
              <option value="">Bütün kateqoriyalar</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">
              Status
            </label>
            <Select
              aria-label="Status"
              value={value.status ?? ""}
              onChange={(e) =>
                onChange({
                  status: (e.target.value || undefined) as
                    | ProductStatus
                    | undefined,
                })
              }
              className="h-9 w-full text-sm"
            >
              <option value="">Bütün statuslar</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-stone-500">
              Anbar
            </label>
            <Select
              aria-label="Anbar"
              value={value.loc ?? ""}
              onChange={(e) => onChange({ loc: e.target.value || undefined })}
              className="h-9 w-full text-sm"
            >
              <option value="">Bütün anbarlar</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </div>
        </div>
      </FilterPanel>
    </div>
  );
}
