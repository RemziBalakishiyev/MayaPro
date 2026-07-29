import { useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
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

/** Mal filtrləri — dəyərlər URL search params-da saxlanılır. */
export function ProductFilters({
  value,
  categories,
  locations,
  onChange,
}: Props) {
  const activeFilterCount = [!!value.cat, !!value.status, !!value.loc].filter(
    Boolean,
  ).length;

  const [filtersOpen, setFiltersOpen] = useState(() => activeFilterCount > 0);

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
          placeholder="Ad, kateqoriya, xüsusiyyət üzrə axtar..."
          className={cn(inputCls, "h-9 pl-8 text-sm")}
        />
      </div>

      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
            <SlidersHorizontal size={16} className="text-stone-500" />
            Filterlər
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {activeFilterCount}
              </span>
            )}
          </span>
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-stone-400 transition-transform",
              filtersOpen && "rotate-180",
            )}
          />
        </button>

        {filtersOpen && (
          <div className="space-y-3 border-t border-stone-200 px-3 py-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-500">
                  Kateqoriya
                </label>
                <Select
                  value={value.cat ?? ""}
                  onChange={(e) =>
                    onChange({ cat: e.target.value || undefined })
                  }
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
                  value={value.loc ?? ""}
                  onChange={(e) =>
                    onChange({ loc: e.target.value || undefined })
                  }
                  className="h-9 w-full text-sm"
                >
                  <option value="">Bütün anbarlar</option>
                  {locations.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </Select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-stone-500 hover:text-emerald-700"
                >
                  Filterləri sıfırla
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
