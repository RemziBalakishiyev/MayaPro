import { useEffect, useId, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import type { ProductExpenseLine } from "@/types";

/** Forma / API ilə eyni forma: { name, amount }. */
export type ExpenseRowValue = ProductExpenseLine;

/** Combobox təklifləri (istəyə bağlı seçim — sərbəst mətn də olar). */
export const EXPENSE_NAME_SUGGESTIONS = [
  "Yol pulu",
  "Fəhlə pulu",
  "Yer/Anbar xərci",
  "Paket/Qutu",
  "Gömrük",
  "Digər",
] as const;

/** Sətirlərin məbləğ cəmi. */
export const rowsTotal = (rows: ExpenseRowValue[]): number =>
  (rows ?? []).reduce((s, r) => s + (Number(r.amount) || 0), 0);

interface Props {
  value: ExpenseRowValue[];
  onChange: (rows: ExpenseRowValue[]) => void;
}

/** Dinamik partiya xərcləri — combobox ad + məbləğ. */
export function ExpenseRows({ value, onChange }: Props) {
  const listId = useId();
  const [open, setOpen] = useState(() => value.length > 0);
  const total = rowsTotal(value);
  const hasRows = value.length > 0;

  useEffect(() => {
    if (hasRows) setOpen(true);
  }, [hasRows]);

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
          <datalist id={listId}>
            {EXPENSE_NAME_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          {value.length === 0 ? (
            <p className="text-xs text-stone-400">
              Yol, fəhlə kimi partiya xərcləri — istəyə bağlı
            </p>
          ) : (
            value.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  list={listId}
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="Xərc adı (məs. Yol pulu)"
                  className="min-w-0 flex-1"
                />
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
                  className="w-[5.5rem] shrink-0 sm:w-28"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Xərci sil"
                >
                  <Trash2 size={16} />
                </button>
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
        </div>
      )}
    </div>
  );
}
