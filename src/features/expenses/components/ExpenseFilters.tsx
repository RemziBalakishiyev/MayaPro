import { FilterBar } from "@/components/ui/FilterBar";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { PERIOD_LABELS, type Period } from "@/features/reports/lib";
import { useExpenseTypes } from "@/features/expense-types/queries";
import type { ExpenseSource } from "@/types";

/** Cədvəldəki mənbə filtri — "all" = süzgəc yoxdur. */
export type ExpenseSourceFilter = "all" | ExpenseSource;

export interface ExpenseFilterValues {
  q?: string;
  period: Period;
  source: ExpenseSourceFilter;
  type?: string;
}

/** Defolt dövr — səhifə parametrsiz açılanda cari təqvim ayı göstərilir. */
export const DEFAULT_EXPENSE_PERIOD: Period = "month";

/** Panel içindəki dövr tabları (Satış jurnalı ilə eyni sıra + "Bu il"). */
const PERIODS: Period[] = ["today", "week", "month", "year", "all"];

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
 * Xərc filtrləri — mallar/satış səhifələri ilə eyni FilterBar naxışı:
 * üst sətirdə axtarış, sağda "Filterlər" toqql düyməsi, paneldə dövr tabları +
 * mənbə və xərc növü select-ləri. Bütün dəyərlər URL-də saxlanılır (F5 sonrası
 * itmir), aktiv filtrlər çip kimi görünür.
 */
export function ExpenseFilters({ value, onChange }: Props) {
  const { data: expenseTypes = [] } = useExpenseTypes();

  // Defolt dövr ("Bu ay") aktiv filtr sayılmır — badge yalnız istifadəçinin
  // qəsdən dəyişdiyi sahələri göstərir.
  const activeFilterCount = [
    value.period !== DEFAULT_EXPENSE_PERIOD,
    value.source !== "all",
    !!value.type,
  ].filter(Boolean).length;

  const activeFilters = [
    value.period !== DEFAULT_EXPENSE_PERIOD && {
      id: "period",
      label: PERIOD_LABELS[value.period],
    },
    value.source !== "all" && {
      id: "source",
      label: sourceFilterLabel(value.source),
    },
    value.type && { id: "type", label: value.type },
  ].filter(Boolean) as Array<{ id: string; label: string }>;

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === "period") onChange({ period: DEFAULT_EXPENSE_PERIOD });
    else if (filterId === "source") onChange({ source: "all" });
    else if (filterId === "type") onChange({ type: undefined });
  };

  const clearFilters = () =>
    onChange({
      period: DEFAULT_EXPENSE_PERIOD,
      source: "all",
      type: undefined,
      q: undefined,
    });

  return (
    <div className="mb-4">
      <FilterBar
        searchValue={value.q ?? ""}
        onSearchChange={(q) => onChange({ q: q || undefined })}
        searchPlaceholder="Xərc adı və ya qeyd üzrə axtar..."
        searchAriaLabel="Xərc axtar"
        activeCount={activeFilterCount}
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onClear={clearFilters}
        clearLabel="Filterləri təmizlə"
        label="Filterlər"
      >
        <div className="space-y-3">
          {/* Dövr tab-ları */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
              Dövr
            </p>
            <div
              role="tablist"
              aria-label="Dövr"
              className="flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1"
            >
              {PERIODS.map((p) => {
                const active = value.period === p;
                return (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChange({ period: p })}
                    className={cn(
                      "flex h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                    )}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                );
              })}
            </div>
          </div>

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
                className="h-11 w-full text-sm"
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
                className="h-11 w-full text-sm"
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
