import { KpiCard } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useDebtsKpi } from "@/features/reports/queries";
import { fmtMoney } from "@/lib/format";

interface Props {
  range: PeriodRange;
}

/**
 * Nisyə Borclar səhifəsi KPI sırası (FE#56, AC20-AC23).
 * `totalOutstanding/debtorCount/topDebtor/oldestDebtDays` anlıq (hazırda)
 * sahələrdir — PeriodFilter yalnız `periodNewDebt`/`periodCollected`-ə təsir edir.
 */
export function DebtsKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useDebtsKpi(range);
  const retry = () => void refetch();

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Ümumi qalıq"
        value={data ? fmtMoney(data.totalOutstanding) : undefined}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Borclu sayı"
        value={data?.debtorCount}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Ən böyük borclu"
        value={data ? (data.topDebtor ? data.topDebtor.name : "Borclu yoxdur") : undefined}
        sub={data?.topDebtor ? fmtMoney(data.topDebtor.amount) : undefined}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Dövrdə yaranan borc"
        value={data ? fmtMoney(data.periodNewDebt) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Dövrdə yığılan ödəniş"
        value={data ? fmtMoney(data.periodCollected) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Ən köhnə borc günü"
        value={
          data
            ? data.oldestDebtDays != null
              ? `${data.oldestDebtDays} gün`
              : "-"
            : undefined
        }
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
    </div>
  );
}
