import { useState } from "react";
import { Wallet } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCan } from "@/features/auth/store";
import { useSalarySummary } from "../queries";
import { SALARY_MONTH_RE, currentSalaryMonth } from "../lib";
import { SalaryMonthSwitcher } from "./SalaryMonthSwitcher";
import { SalaryCard } from "./SalaryCard";
import { SalaryPayModal } from "./SalaryPayModal";
import { SalaryDeductionModal } from "./SalaryDeductionModal";
import { SalaryHistoryDrawer } from "./SalaryHistoryDrawer";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  /** URL-dən gələn ay ("yyyy-MM") — yoxdursa/etibarsızdırsa cari ay istifadə olunur. */
  month?: string;
  onMonthChange: (month: string) => void;
}

/** "Maaşlar" görünüşü — hər işçi bir kart, ay filtri, ödəniş/tutulma/tarixçə. */
export function SalaryBoard({ month: monthProp, onMonthChange }: Props) {
  const month =
    monthProp && SALARY_MONTH_RE.test(monthProp) ? monthProp : currentSalaryMonth();
  const { data: rows, isLoading, isError, error } = useSalarySummary(month);
  const canRecord = useCan()("salary.record");
  const canSetSalary = useCan()("salary.set");

  const [payFor, setPayFor] = useState<EmployeeSalarySummary | null>(null);
  const [deductFor, setDeductFor] = useState<EmployeeSalarySummary | null>(null);
  const [historyFor, setHistoryFor] = useState<EmployeeSalarySummary | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          Aylıq maaş hesablanması — işçi başına ödəniş/tutulma
        </p>
        <SalaryMonthSwitcher month={month} onChange={onMonthChange} />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm font-medium text-red-700">
          {error instanceof Error ? error.message : "Maaş məlumatı yüklənmədi"}
        </div>
      ) : !rows || rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="İşçi tapılmadı"
          hint="Maaş hesablaması üçün əvvəlcə işçi əlavə edin."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <SalaryCard
              key={r.userId}
              summary={r}
              month={month}
              canRecord={canRecord}
              canSetSalary={canSetSalary}
              onPay={() => setPayFor(r)}
              onDeduct={() => setDeductFor(r)}
              onHistory={() => setHistoryFor(r)}
            />
          ))}
        </div>
      )}

      <SalaryPayModal
        open={!!payFor}
        employee={payFor}
        month={month}
        onClose={() => setPayFor(null)}
      />
      <SalaryDeductionModal
        open={!!deductFor}
        employee={deductFor}
        month={month}
        onClose={() => setDeductFor(null)}
      />
      <SalaryHistoryDrawer
        employee={historyFor}
        month={month}
        onClose={() => setHistoryFor(null)}
      />
    </div>
  );
}
