import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import type { ProductExpenseLine } from "@/types";

/** Forma / API ilə eyni forma: { name, amount }. */
export type ExpenseRowValue = ProductExpenseLine;

/** Select-dən seçiləndə ad inputuna yazılan hazır adlar. */
export const EXPENSE_PRESETS = [
  "Yol pulu",
  "Fəhlə pulu",
  "Yer/Anbar xərci",
  "Paket/Qutu",
  "Gömrük",
] as const;

const CUSTOM_VALUE = "__custom__";

/** Sətirlərin məbləğ cəmi (yalnız adı dolu olanlar). */
export const rowsTotal = (rows: ExpenseRowValue[]): number =>
  (rows ?? []).reduce((s, r) => {
    if (!(r.name ?? "").trim()) return s;
    return s + (Number(r.amount) || 0);
  }, 0);

/** Məbləği var, adı boş olan sətir indeksləri. */
export const incompleteExpenseIndexes = (rows: ExpenseRowValue[]): number[] =>
  (rows ?? [])
    .map((r, i) =>
      (Number(r.amount) || 0) > 0 && !(r.name ?? "").trim() ? i : -1,
    )
    .filter((i) => i >= 0);

const selectValueForName = (name: string): string => {
  const trimmed = name.trim();
  return (EXPENSE_PRESETS as readonly string[]).includes(trimmed)
    ? trimmed
    : CUSTOM_VALUE;
};

interface Props {
  value: ExpenseRowValue[];
  onChange: (rows: ExpenseRowValue[]) => void;
  /** Validasiya xəbərdarlığı (məs. məbləğ var, ad boş). */
  error?: string;
}

/** Dinamik partiya xərcləri — növ select + ad input + məbləğ. */
export function ExpenseRows({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(() => value.length > 0);
  const nameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusIdx = useRef<number | null>(null);
  const total = rowsTotal(value);
  const hasRows = value.length > 0;

  useEffect(() => {
    if (hasRows) setOpen(true);
  }, [hasRows]);

  useEffect(() => {
    if (focusIdx.current == null) return;
    const el = nameRefs.current[focusIdx.current];
    focusIdx.current = null;
    el?.focus();
  });

  const addRow = () => {
    onChange([...value, { name: "", amount: 0 }]);
    setOpen(true);
  };

  const updateRow = (idx: number, patch: Partial<ExpenseRowValue>) => {
    onChange(value.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  const onSelectKind = (idx: number, selected: string) => {
    if (selected === CUSTOM_VALUE) {
      updateRow(idx, { name: "" });
      focusIdx.current = idx;
      return;
    }
    updateRow(idx, { name: selected });
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
          Partiya xərcləri
          {total > 0 && (
            <span className="ml-1 text-emerald-700"> · {fmtMoney(total)}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-stone-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 px-3 pb-3">
          {value.length === 0 ? (
            <p className="text-xs text-stone-400">
              Yol, fəhlə kimi partiya xərcləri — istəyə bağlı
            </p>
          ) : (
            value.map((row, idx) => (
              <div
                key={idx}
                className="space-y-2 rounded-xl border border-stone-100 bg-stone-50/80 p-2 sm:grid sm:grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)_5.5rem_auto] sm:items-center sm:gap-2 sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0"
              >
                {/* Mobil: növ + ad üst sətir; desktop: sm:contents → eyni grid sətiri */}
                <div className="flex gap-2 sm:contents">
                  <Select
                    value={selectValueForName(row.name)}
                    onChange={(e) => onSelectKind(idx, e.target.value)}
                    className="min-w-0 flex-1"
                  >
                    {EXPENSE_PRESETS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    <option value={CUSTOM_VALUE}>Digər (öz adın)</option>
                  </Select>
                  <Input
                    ref={(el) => {
                      nameRefs.current[idx] = el;
                    }}
                    value={row.name}
                    onChange={(e) => updateRow(idx, { name: e.target.value })}
                    placeholder="Xərc adı"
                    className="min-w-0 flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 sm:contents">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={row.amount || ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      updateRow(idx, {
                        amount: Number.isFinite(n) && n >= 0 ? n : 0,
                      });
                    }}
                    className="min-w-0 flex-1 sm:w-[5.5rem] sm:flex-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 sm:h-auto sm:w-auto sm:p-2"
                    aria-label="Xərci sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={addRow}
          >
            Xərc əlavə et
          </Button>
          {error && (
            <p className="text-xs font-medium text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
