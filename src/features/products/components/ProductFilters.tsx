import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
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
 * FilterBar istifadə edir: üst sətirdə axtarış, sağda "Filterlər" toqql düyməsi.
 * Açılan paneldə 3 select (kateqoriya, status, anbar).
 * Aktif filtrlər çiplər sırasında göstərilir (panel bağlı olsa da).
 */
export function ProductFilters({
  value,
  categories,
  locations,
  onChange,
}: Props) {
  const activeFilterCount = [!!value.cat, !!value.status, !!value.loc].filter(
    Boolean,
  ).length;

  // Aktif filtrlər çiplər üçün
  const activeFilters = [
    value.cat && { id: "cat", label: value.cat },
    value.status && { id: "status", label: value.status },
    value.loc && { id: "loc", label: value.loc },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "cat") onChange({ cat: undefined });
    else if (filterId === "status") onChange({ status: undefined });
    else if (filterId === "loc") onChange({ loc: undefined });
  };

  const clearFilters = () =>
    onChange({ cat: undefined, status: undefined, loc: undefined });

  return (
    <div className="mb-4">
      <FilterBar
        searchValue={value.q ?? ""}
        onSearchChange={(q) => onChange({ q: q || undefined })}
        searchPlaceholder="Bu siyahıda axtar..."
        searchAriaLabel="Mal axtar"
        activeCount={activeFilterCount}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClear={clearFilters}
        clearLabel="Filterləri təmizlə"
        label="Filterlər"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      </FilterBar>
    </div>
  );
}
