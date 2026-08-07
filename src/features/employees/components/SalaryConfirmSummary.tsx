import { AlertTriangle, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { formatSalaryMonth } from "../lib";
import type { EmployeeSalarySummary } from "@/types";

function ConfirmRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <span className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-stone-600">{label}</span>
      <span className={cn("font-bold tabular-nums", tone ?? "text-stone-900")}>
        {value}
      </span>
    </span>
  );
}

interface Props {
  employee: EmployeeSalarySummary;
  month: string;
  amount: number;
  /** Əməliyyatdan SONRAKI qalıq (mənfi ola bilər — artıq ödəniş deməkdir). */
  remainingAfter: number;
  /** "Maaş ödə" kassaya təsir edir, "Tutulma əlavə et" etmir (AC-11). */
  affectsCash?: boolean;
  /** Artıq-ödəniş xəbərdarlığının mətni — əməliyyata görə fərqlənir. */
  warningText?: string;
}

/**
 * FE#79 (AC-9/AC-10/AC-11) — "Maaş ödə" və "Tutulma əlavə et" təsdiq
 * dialoqunun ortaq məzmunu: işçi adı · ay · məbləğ · əməliyyatdan SONRAKI
 * qalıq ("Qalıq: 470 ₼ → 370 ₼"), artıq-ödəniş narıncı xəbərdarlığı və
 * (ödənişdə) kassa təsiri qeydi.
 *
 * `ConfirmModal.message` bir `<p>` daxilində göstərilir — ona görə `div`
 * DEYİL, yalnız `span` (block) istifadə olunur (bax `DayEndCard.tsx`-dəki
 * eyni naxış, sətir 239).
 */
export function SalaryConfirmSummary({
  employee,
  month,
  amount,
  remainingAfter,
  affectsCash = false,
  warningText = "Bu əməliyyatla maaşdan artıq veriləcək.",
}: Props) {
  const overpaid = remainingAfter < 0;

  return (
    <span className="block space-y-1.5">
      <ConfirmRow label="İşçi" value={employee.fullName} />
      <ConfirmRow label="Ay" value={formatSalaryMonth(month)} />
      <ConfirmRow label="Məbləğ" value={fmtMoney(amount)} />
      <ConfirmRow
        label="Qalıq"
        value={`${fmtMoney(employee.remaining)} → ${fmtMoney(remainingAfter)}`}
        tone={overpaid ? "text-orange-600" : undefined}
      />

      {overpaid && (
        <span
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-chip bg-orange-50 px-3 py-2.5 text-xs font-semibold text-orange-800 ring-1 ring-orange-200"
        >
          <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
          {warningText}
        </span>
      )}

      {affectsCash && (
        <span className="mt-2 flex items-start gap-2 rounded-chip bg-stone-50 px-3 py-2.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200">
          <Wallet size={14} aria-hidden className="mt-0.5 shrink-0" />
          Kassadan çıxacaq — gün sonunda nəzərə alınır.
        </span>
      )}
    </span>
  );
}
