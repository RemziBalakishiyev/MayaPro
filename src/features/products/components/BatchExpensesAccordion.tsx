import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { totalExpenses } from "../lib";
import type { ExpenseBreakdown } from "@/types";

export const EMPTY_EXPENSES: ExpenseBreakdown = {
  yol: 0,
  fehle: 0,
  yer: 0,
  paket: 0,
  diger: 0,
};

const FIELDS: { key: keyof ExpenseBreakdown; label: string }[] = [
  { key: "yol", label: "Yol pulu" },
  { key: "fehle", label: "Fəhlə pulu" },
  { key: "yer", label: "Yer/anbar xərci" },
  { key: "paket", label: "Paket/qutu xərci" },
  { key: "diger", label: "Digər xərc" },
];

interface Props {
  value: ExpenseBreakdown;
  onChange: (next: ExpenseBreakdown) => void;
  /** İlk açılışda açıq olsunmu (defolt bağlı). */
  defaultOpen?: boolean;
}

/** Partiya xərcləri accordion — ProductForm və sərbəst satışda eyni. */
export function BatchExpensesAccordion({
  value,
  onChange,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const total = totalExpenses(value);

  const setField = (key: keyof ExpenseBreakdown, raw: string) => {
    const n = Number(raw);
    onChange({ ...value, [key]: Number.isFinite(n) && n >= 0 ? n : 0 });
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
        <div className="grid grid-cols-2 gap-3 px-3 pb-3">
          {FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={value[key] || ""}
                onChange={(e) => setField(key, e.target.value)}
                placeholder="0"
              />
            </Field>
          ))}
        </div>
      )}
    </div>
  );
}
