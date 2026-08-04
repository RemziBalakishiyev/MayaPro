import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import { useExpenseTypes } from "@/features/expense-types/queries";
import type { ExpenseSource } from "@/types";

/** Cədvəldəki mənbə filtri — "all" = süzgəc yoxdur. */
export type ExpenseSourceFilter = "all" | ExpenseSource;

/**
 * FE#56 — dövr artıq bu tipin xaricində, paylaşılan `PeriodFilter` ilə
 * (səhifə səviyyəsində, `from`/`to` URL parametrləri) idarə olunur.
 */
export interface ExpenseFilterValues {
  q?: string;
  source: ExpenseSourceFilter;
  type?: string;
}

const SOURCE_OPTIONS: { key: ExpenseSourceFilter; label: string }[] = [
  { key: "all", label: "Hamısı" },
  { key: "general", label: "Ümumi" },
  { key: "product", label: "Mala bağlı" },
];

export const sourceFilterLabel = (source: ExpenseSourceFilter): string =>
  SOURCE_OPTIONS.find((s) => s.key === source)?.label ?? "Hamısı";

interface Props {
  value: ExpenseFilterValues;
  /** Yalnız dəyişən sahələr göndərilir (URL search params-a yazılır). */
  onChange: (patch: Partial<ExpenseFilterValues>) => void;
}

/**
 * Xərc filtrləri — mallar/satış səhifələri ilə eyni FilterBar naxışı: üst
 * sətirdə axtarış, sağda "Filterlər" toqql düyməsi, paneldə mənbə və xərc
 * növü select-ləri. Dövr artıq bu komponentdə deyil — səhifə üzərindəki
 * paylaşılan `PeriodFilter` idarə edir (FE#56, AC17). Bütün dəyərlər URL-də
 * saxlanılır (F5 sonrası itmir), aktiv filtrlər çip kimi görünür.
 */
export function ExpenseFilters({ value, onChange }: Props) {
  const { data: expenseTypes = [] } = useExpenseTypes();

  const activeFilterCount = [value.source !== "all", !!value.type].filter(
    Boolean,
  ).length;

  const activeFilters = [
    value.source !== "all" && {
      id: "source",
      label: sourceFilterLabel(value.source),
    },
    value.type && { id: "type", label: value.type },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "source") onChange({ source: "all" });
    else if (filterId === "type") onChange({ type: undefined });
  };

  const clearFilters = () =>
    onChange({
      source: "all",
      type: undefined,
      q: undefined,
    });

  return (
    <div className="mb-4">
      <FilterBar
        searchValue={value.q ?? ""}
        onSearchChange={(q) => onChange({ q: q || undefined })}
        searchPlaceholder="Bu siyahıda axtar..."
        searchAriaLabel="Xərc axtar"
        activeCount={activeFilterCount}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClear={clearFilters}
        clearLabel="Filterləri təmizlə"
        label="Filterlər"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">
                Mənbə
              </label>
              <Select
                aria-label="Mənbə"
                value={value.source}
                onChange={(e) =>
                  onChange({ source: e.target.value as ExpenseSourceFilter })
                }
                className="h-9 w-full text-sm"
              >
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-stone-500">
                Xərc növü
              </label>
              <Select
                aria-label="Xərc növü"
                value={value.type ?? ""}
                onChange={(e) => onChange({ type: e.target.value || undefined })}
                className="h-9 w-full text-sm"
              >
                <option value="">Bütün növlər</option>
                {expenseTypes.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      </FilterBar>
    </div>
  );
}
