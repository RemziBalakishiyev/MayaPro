import { useId, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { Select } from "@/components/ui/Select";
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
 *
 * FE#70 (AC-5/AC-6/AC-7): lokal axtarış paylaşılan `TableToolbar` daxilindəki
 * `LocalTableSearch`-dədir (`src/routes/_app.musteriler.tsx` naxışı ilə eyni
 * yerləşmə — cədvəldən dərhal əvvəl, başlıqdan ayrı deyil). Sağda "Filterlər"
 * toqql düyməsi (aktiv filtr sayı bədge ilə) `TableToolbar.actions` sırasında;
 * açılan panel (kateqoriya/status/anbar seçimləri) və aktiv filtr çipləri
 * toolbar-ın altında, birbaşa cədvəldən əvvəl göstərilir. Panel/çip
 * görünüşü əvvəlki `FilterBar` ilə eynidir (yalnız axtarış hissəsi
 * `TableToolbar`-a köçürülüb) — mövcud primitivlər yenidən yazılmayıb.
 */
export function ProductFilters({
  value,
  categories,
  locations,
  onChange,
}: Props) {
  const panelId = useId();
  const activeFilterCount = [!!value.cat, !!value.status, !!value.loc].filter(
    Boolean,
  ).length;
  const [open, setOpen] = useState(() => activeFilterCount > 0);

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
      <TableToolbar
        search={
          <LocalTableSearch
            value={value.q ?? ""}
            onChange={(q) => onChange({ q: q || undefined })}
            placeholder="Bu siyahıda mal adı, kateqoriya və xüsusiyyət üzrə axtar"
            ariaLabel="Mal siyahısında axtar"
          />
        }
        actions={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={panelId}
            className="focus-ring shrink-0 flex h-12 items-center justify-center gap-2 px-4 rounded-control border border-stone-300 bg-white text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
          >
            <SlidersHorizontal size={16} className="text-stone-500" />
            Filterlər
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {activeFilterCount}
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
        }
      />

      {/* Aktiv filtrlər çiplər sırasında (panel bağlı olsa da görünsün) */}
      {activeFilters.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-4 rounded-control border border-stone-200 bg-stone-50/60 px-3 py-2">
          {activeFilters.map((filter) => (
            <div
              key={filter.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
            >
              <span>{filter.label}</span>
              <span className="relative ml-0.5 inline-flex h-4 w-4 shrink-0">
                <button
                  type="button"
                  onClick={() => handleRemoveFilter(filter.id)}
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

      {/* Açılan filtr paneli */}
      <div
        id={panelId}
        hidden={!open}
        className="mb-2 rounded-control border border-stone-200 bg-stone-50/60 px-3 py-3"
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
              className="h-10 w-full text-sm"
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
              className="h-10 w-full text-sm"
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
              className="h-10 w-full text-sm"
            >
              <option value="">Bütün anbarlar</option>
              {locations.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="focus-ring inline-flex min-h-[40px] items-center justify-center rounded-chip px-2 text-sm font-semibold text-stone-600 hover:text-emerald-700"
            >
              Filterləri təmizlə
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
