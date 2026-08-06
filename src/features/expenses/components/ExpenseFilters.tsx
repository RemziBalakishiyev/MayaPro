import { useId, useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
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
 * FE#76 (AC-3/AC-4) — axtarış paylaşılan `TableToolbar` daxilindəki
 * `LocalTableSearch`-dədir (`Mallar`/`Təchizatçılar`/`Müştərilər` naxışı ilə
 * eyni yerləşmə — cədvəldən dərhal əvvəl). Sağda "Filterlər" toqql düyməsi
 * (aktiv filtr sayı bədge ilə) `TableToolbar.actions` sırasında; açılan panel
 * (mənbə/xərc növü seçimləri) və aktiv filtr çipləri toolbar-ın altında,
 * birbaşa cədvəldən əvvəl göstərilir (`ProductFilters.tsx` ilə EYNİ naxış —
 * mövcud primitivlər yenidən yazılmayıb). Dövr artıq bu komponentdə deyil —
 * səhifə üzərindəki paylaşılan `PeriodFilter` idarə edir (FE#56). Bütün
 * dəyərlər URL-də saxlanılır (F5 sonrası itmir).
 */
export function ExpenseFilters({ value, onChange }: Props) {
  const { data: expenseTypes = [] } = useExpenseTypes();
  const panelId = useId();

  const activeFilterCount = [value.source !== "all", !!value.type].filter(
    Boolean,
  ).length;
  const [open, setOpen] = useState(() => activeFilterCount > 0);

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

  const clearFilters = () => onChange({ source: "all", type: undefined });

  return (
    <div className="mb-4">
      <TableToolbar
        search={
          <LocalTableSearch
            value={value.q ?? ""}
            onChange={(q) => onChange({ q: q || undefined })}
            placeholder="Bu siyahıda axtar... (ad və ya qeyd)"
            ariaLabel="Xərc siyahısında axtar"
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
              className="h-10 w-full text-sm"
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
              className="h-10 w-full text-sm"
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
