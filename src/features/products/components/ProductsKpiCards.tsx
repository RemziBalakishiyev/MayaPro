import { KpiCard } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useProductsKpi } from "@/features/reports/queries";
import { fmtMoney, fmtMoneySigned } from "@/lib/format";

interface Props {
  range: PeriodRange;
}

/**
 * Mallar səhifəsi başlıq altı KPI kartları (FE#56, AC11-AC14).
 * `productCount/totalStockUnits/totalCostValue/totalSaleValue/potentialProfit/lowStockCount`
 * anlıq (snapshot) sahələrdir — PeriodFilter yalnız "Anbardakı mal" kartındakı
 * "Bu dövrdə satılan/alınan" alt sətrinə (soldUnits/purchasedUnits) təsir edir.
 */
export function ProductsKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useProductsKpi(range);
  const retry = () => void refetch();

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Mal sayı"
        value={data?.productCount}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Anbardakı mal"
        value={data ? `${data.totalStockUnits} ədəd` : undefined}
        sub={
          data
            ? `Bu dövrdə satılan: ${data.soldUnits} · alınan: ${data.purchasedUnits}`
            : undefined
        }
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Anbarın maya dəyəri"
        value={data ? fmtMoney(data.totalCostValue) : undefined}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Satış dəyəri"
        value={data ? fmtMoney(data.totalSaleValue) : undefined}
        sub={
          data
            ? `Potensial qazanc: ${fmtMoneySigned(data.potentialProfit)}`
            : undefined
        }
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
      <KpiCard
        label="Azalan mal"
        value={data?.lowStockCount}
        tone={data && data.lowStockCount > 0 ? "amber" : "default"}
        note="hazırda"
        isLoading={isLoading}
        isError={isError}
        onRetry={retry}
      />
    </div>
  );
}
