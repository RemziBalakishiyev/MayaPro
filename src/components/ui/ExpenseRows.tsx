import { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import type { ExpenseBreakdown } from "@/types";

/** Backend breakdown açarları. */
export type ExpenseKind = keyof ExpenseBreakdown;

/** Forma daxili dinamik xərc sətri. */
export interface ExpenseRowValue {
  kind: ExpenseKind;
  amount: number;
}

export const EMPTY_EXPENSES: ExpenseBreakdown = {
  yol: 0,
  fehle: 0,
  yer: 0,
  paket: 0,
  diger: 0,
};

export const EXPENSE_KIND_OPTIONS: { value: ExpenseKind; label: string }[] = [
  { value: "yol", label: "Yol pulu" },
  { value: "fehle", label: "Fəhlə pulu" },
  { value: "yer", label: "Yer/Anbar xərci" },
  { value: "paket", label: "Paket/Qutu" },
  { value: "diger", label: "Digər" },
];

/** Sətirlər → breakdown (eyni növ cəmlənir). Backend dəyişmir. */
export const rowsToBreakdown = (rows: ExpenseRowValue[]): ExpenseBreakdown => {
  const out: ExpenseBreakdown = { ...EMPTY_EXPENSES };
  for (const r of rows) {
    const n = Number(r.amount) || 0;
    if (n > 0 && r.kind in out) out[r.kind] += n;
  }
  return out;
};

/** Breakdown → sətirlər (yalnız sıfırdan fərqli; redaktə açılışı). */
export const breakdownToRows = (b: ExpenseBreakdown): ExpenseRowValue[] => {
  const rows: ExpenseRowValue[] = [];
  for (const { value } of EXPENSE_KIND_OPTIONS) {
    const n = Number(b[value]) || 0;
    if (n > 0) rows.push({ kind: value, amount: n });
  }
  return rows;
};

/** Sətirlərin məbləğ cəmi. */
export const rowsTotal = (rows: ExpenseRowValue[]): number =>
  rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

interface Props {
  value: ExpenseRowValue[];
  onChange: (rows: ExpenseRowValue[]) => void;
}

/** Dinamik partiya xərcləri accordion — ProductForm və sərbəst satışda eyni. */
export function ExpenseRows({ value, onChange }: Props) {
  const [open, setOpen] = useState(() => value.length > 0);
  const total = rowsTotal(value);
  const hasRows = value.length > 0;

  // Form reset/redaktə ilə sətirlər gələndə accordion açılsın (əl ilə bağlamağı pozmur).
  useEffect(() => {
    if (hasRows) setOpen(true);
  }, [hasRows]);

  const addRow = () => {
    onChange([...value, { kind: "yol", amount: 0 }]);
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
          {value.length === 0 ? (
            <p className="text-xs text-stone-400">
              Yol, fəhlə kimi partiya xərcləri — istəyə bağlı
            </p>
          ) : (
            value.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={row.kind}
                  onChange={(e) =>
                    updateRow(idx, { kind: e.target.value as ExpenseKind })
                  }
                  className="min-w-0 flex-1"
                >
                  {EXPENSE_KIND_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
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
