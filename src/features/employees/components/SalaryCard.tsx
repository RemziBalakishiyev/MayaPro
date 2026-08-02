import { useEffect, useRef, useState } from "react";
import { Check, History, HandCoins, MinusCircle, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney, parseMoneyInput } from "@/lib/format";
import { useSalaryEntries, useSetEmployeeSalary } from "../queries";
import { salaryProgressPercent } from "../lib";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  summary: EmployeeSalarySummary;
  month: string;
  canRecord: boolean;
  canSetSalary: boolean;
  onPay: () => void;
  onDeduct: () => void;
  onHistory: () => void;
}

/** Bir işçinin bir ay üçün maaş kartı: 3 böyük rəqəm + proqres + [Pul ver]/[Tutulma yaz]/[Tarixçə]. */
export function SalaryCard({
  summary,
  month,
  canRecord,
  canSetSalary,
  onPay,
  onDeduct,
  onHistory,
}: Props) {
  const toast = useToast();
  const setSalaryMut = useSetEmployeeSalary();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(summary.monthlySalary));
  const inputRef = useRef<HTMLInputElement>(null);

  // Tutulma varsa (kiçik sətir üçün) o ayın sətirlərini gətiririk — cəm artıq
  // xülasədə var, burada yalnız səbəb mətnləri lazımdır.
  const { data: entries = [] } = useSalaryEntries(
    summary.userId,
    month,
    summary.deductionTotal > 0,
  );
  const deductionNotes = entries
    .filter((e) => e.type === "deduction")
    .map((e) => e.note?.trim())
    .filter((n): n is string => !!n);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(String(summary.monthlySalary));
  }, [summary.monthlySalary, editing]);

  const saveSalary = async () => {
    const n = parseMoneyInput(draft);
    if (n === null || n < 0) {
      toast.error("Maaş mənfi ola bilməz");
      return;
    }
    try {
      await setSalaryMut.mutateAsync({ employeeId: summary.userId, monthlySalary: n });
      toast.success("Maaş təyin edildi");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Maaş təyin edilmədi");
    }
  };

  const progress = salaryProgressPercent(summary.paidTotal, summary.monthlySalary);
  const overpaid = summary.remaining < 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
          {summary.fullName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-stone-900">{summary.fullName}</p>
        </div>
        <Badge tone={summary.role}>{summary.role}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Maaş</p>
          {editing ? (
            <div className="mt-0.5 flex items-center gap-1">
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveSalary();
                  if (e.key === "Escape") setEditing(false);
                }}
                aria-label={`${summary.fullName} — aylıq maaş`}
                className="h-8 w-full min-w-0 rounded-lg border border-emerald-400 px-1.5 text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <button
                type="button"
                aria-label="Yadda saxla"
                onClick={() => void saveSalary()}
                disabled={setSalaryMut.isPending}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50"
              >
                <Check size={15} />
              </button>
              <button
                type="button"
                aria-label="İmtina"
                onClick={() => setEditing(false)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canSetSalary}
              onClick={() => canSetSalary && setEditing(true)}
              title={canSetSalary ? "Maaşı dəyiş" : undefined}
              className={cn(
                "group mt-0.5 flex items-center gap-1 text-lg font-bold tabular-nums text-stone-900",
                canSetSalary && "cursor-pointer hover:text-emerald-700",
              )}
            >
              {fmtMoney(summary.monthlySalary)}
              {canSetSalary && (
                <Pencil
                  size={12}
                  className="shrink-0 text-stone-300 group-hover:text-emerald-600"
                />
              )}
            </button>
          )}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Verilib</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-emerald-700">
            {fmtMoney(summary.paidTotal)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            {overpaid ? "Artıq verilib" : "Qalıb"}
          </p>
          <p
            className={cn(
              "mt-0.5 text-lg font-extrabold tabular-nums",
              overpaid ? "text-orange-600" : "text-stone-900",
            )}
          >
            {fmtMoney(Math.abs(summary.remaining))}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <div
          className={cn("h-full rounded-full", overpaid ? "bg-orange-500" : "bg-emerald-600")}
          style={{ width: `${overpaid ? 100 : progress}%` }}
        />
      </div>

      {summary.deductionTotal > 0 && (
        <p className="mt-2 text-xs text-stone-500">
          Tutulma: {fmtMoney(summary.deductionTotal)}
          {deductionNotes.length > 0 && ` (${deductionNotes.join(", ")})`}
        </p>
      )}

      <div className="mt-3.5 grid grid-cols-3 gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canRecord}
          onClick={onPay}
          icon={<HandCoins size={14} />}
          title="Pul ver"
          className="min-w-0 px-1.5 text-xs"
        >
          <span className="truncate">Pul ver</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canRecord}
          onClick={onDeduct}
          icon={<MinusCircle size={14} />}
          title="Tutulma yaz"
          className="min-w-0 px-1.5 text-xs"
        >
          <span className="truncate">Tutulma</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onHistory}
          icon={<History size={14} />}
          title="Tarixçə"
          className="min-w-0 px-1.5 text-xs"
        >
          <span className="truncate">Tarixçə</span>
        </Button>
      </div>
    </div>
  );
}
