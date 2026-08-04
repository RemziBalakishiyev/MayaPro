import { AlertTriangle } from "lucide-react";
import { KpiCard, StatCluster } from "@/components/ui/KpiCard";
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
 * Satış jurnalı üstü KPI kompozisiyası (FE#61, FE#56 üzərində yenidən dizayn)
 * — jurnal filtri ilə eyni PeriodFilter aralığını paylaşır, bütün sahələr
 * artıq dövrə bağlı olduğu üçün ayrıca "hazırda" ayrımına ehtiyac yoxdur.
 * Tək bərabər 7 kartlıq cərgə əvəzinə iyerarxiya: əsas nəticələr (say/satış/
 * qazanc) + ödəniş növü üzrə bölgü tək panellərdə, "Orta satış" isə kiçik
 * yan blokda.
 */
export function SalesKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useSalesKpi(range);
  const retry = () => void refetch();

  // AC18 — naməlum qazanclı satışlar barədə xəbərdarlıq: "Ümumi qazanc"
  // rəqəminin bu satışları ehtiva ETMƏDİYİ aydın olsun deyə gözə çarpan
  // (kəhrəba) rəngdə, "Ümumi qazanc" statının altında göstərilir.
  const unknownNote =
    data && data.unknownProfitSalesCount > 0 ? (
      <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
        <AlertTriangle size={12} className="shrink-0" />
        {`${data.unknownProfitSalesCount} satış naməlum, ${fmtMoney(data.unknownProfitAmount)} daxil edilməyib`}
      </span>
    ) : undefined;

  return (
    <div className="mb-3 flex flex-col gap-3 lg:flex-row">
      <StatCluster
        className="lg:flex-[3]"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
        items={[
          { key: "count", label: "Satış sayı", value: data?.salesCount },
          {
            key: "revenue",
            label: "Ümumi satış",
            value: data ? fmtMoney(data.totalRevenue) : undefined,
          },
          {
            key: "profit",
            label: "Ümumi qazanc",
            value: data ? fmtMoney(data.totalProfit) : undefined,
            sub: unknownNote,
          },
        ]}
      />

      <StatCluster
        className="lg:flex-[3]"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
        items={[
          {
            key: "cash",
            label: "Nağd qazanc",
            value: data
              ? fmtMoney(profitFor(data.byPayment, "Nağd") ?? 0)
              : undefined,
          },
          {
            key: "card",
            label: "Kart qazanc",
            value: data
              ? fmtMoney(profitFor(data.byPayment, "Kart") ?? 0)
              : undefined,
          },
          {
            key: "credit",
            label: "Nisyə qazanc",
            value: data
              ? fmtMoney(profitFor(data.byPayment, "Nisyə") ?? 0)
              : undefined,
          },
        ]}
      />

      <KpiCard
        className="lg:w-48 lg:shrink-0"
        label="Orta satış"
        value={data ? fmtMoney(data.avgSale) : undefined}
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
    </div>
  );
}
