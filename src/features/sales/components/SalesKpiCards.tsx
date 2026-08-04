import { KpiCard } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useSalesKpi } from "@/features/reports/queries";
import { fmtMoney } from "@/lib/format";
import type { PaymentType } from "@/types";
import type { PaymentTypeKpi } from "@/features/reports/api";

interface Props {
  range: PeriodRange;
}

const profitFor = (
  byPayment: PaymentTypeKpi[] | undefined,
  type: PaymentType,
): number | undefined => byPayment?.find((p) => p.type === type)?.profit;

/**
 * Satış jurnalı üstü KPI sırası (FE#56, AC15/AC18/AC19) — jurnal filtri ilə
 * eyni PeriodFilter aralığını paylaşır, ayrıca dövr seçimi yoxdur.
 */
export function SalesKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useSalesKpi(range);
  const retry = () => void refetch();

  const unknownNote =
    data && data.unknownProfitSalesCount > 0
      ? `${data.unknownProfitSalesCount} satış naməlum, ${fmtMoney(data.unknownProfitAmount)} daxil edilməyib`
      : undefined;

  return (
    <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      <KpiCard
        label="Satış sayı"
        value={data?.salesCount}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Ümumi satış"
        value={data ? fmtMoney(data.totalRevenue) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Ümumi qazanc"
        value={data ? fmtMoney(data.totalProfit) : undefined}
        sub={unknownNote}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Nağd qazanc"
        value={data ? fmtMoney(profitFor(data.byPayment, "Nağd") ?? 0) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Kart qazanc"
        value={data ? fmtMoney(profitFor(data.byPayment, "Kart") ?? 0) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Nisyə qazanc"
        value={data ? fmtMoney(profitFor(data.byPayment, "Nisyə") ?? 0) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Orta satış"
        value={data ? fmtMoney(data.avgSale) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
    </div>
  );
}
