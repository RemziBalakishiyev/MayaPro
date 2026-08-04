import { AlertTriangle } from "lucide-react";
import { AlertPill, KpiCard, StatCluster } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useProductsKpi } from "@/features/reports/queries";
import { fmtMoney, fmtMoneySigned } from "@/lib/format";

interface Props {
  range: PeriodRange;
  /** "N mal azalır" çipinə klik — çağıran tərəf status filtrini "Azalır"a keçirir. */
  onLowStockClick?: () => void;
}

/**
 * Mallar səhifəsi başlıq altı KPI kompozisiyası (FE#61, FE#56 üzərində
 * yenidən dizayn).
 *
 * `productCount/totalStockUnits/totalCostValue/totalSaleValue/potentialProfit/
 * lowStockCount` anlıq (snapshot) sahələrdir — buna görə "hazırda" nişanı ilə
 * təkrar-təkrar qeyd etmək əvəzinə sadəcə heç bir dövr göstəricisi ilə YANAŞI
 * göstərilmirlər: yeganə dövrə bağlı cüt (`soldUnits`/`purchasedUnits`)
 * PeriodFilter çiplərinin birbaşa altındakı "Bu dövrdə…" sətrinə keçib, bu da
 * onu vizual olaraq dövrlə eyni qrupda, KPI panelindən isə ayrı saxlayır.
 *
 * FE#65 — dövr çipi dəyişəndə `useProductsKpi` `placeholderData` ilə köhnə
 * nəticəni saxlayır, buna görə StatCluster/KpiCard/AlertPill `isLoading`-ə
 * (yalnız İLK yüklənmədə true) əsaslanır və sabit qalır; YALNIZ "Bu dövrdə…"
 * sətri `isFetching`-ə görə yenilənərkən loading göstərir.
 */
export function ProductsKpiCards({ range, onLowStockClick }: Props) {
  const { data, isLoading, isFetching, isError, refetch } =
    useProductsKpi(range);
  const retry = () => void refetch();

  return (
    <div className="mb-4">
      <p className="mb-4 min-h-[1rem] text-xs text-stone-500">
        {isFetching ? (
          <span className="inline-block h-3 w-48 animate-pulse rounded bg-stone-100 align-middle" />
        ) : isError ? (
          "Bu dövrdə: —"
        ) : (
          <>
            Bu dövrdə:{" "}
            <span className="font-semibold text-stone-700">
              {data?.soldUnits}
            </span>{" "}
            satılıb ·{" "}
            <span className="font-semibold text-stone-700">
              {data?.purchasedUnits}
            </span>{" "}
            alınıb
          </>
        )}
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <StatCluster
            className="sm:flex-[2]"
            isLoading={isLoading}
            isError={isError}
            onRetry={retry}
            items={[
              { key: "count", label: "Mal sayı", value: data?.productCount },
              {
                key: "stock",
                label: "Anbardakı ədəd",
                value: data ? `${data.totalStockUnits} ədəd` : undefined,
              },
              {
                key: "cost",
                label: "Maya dəyəri",
                value: data ? fmtMoney(data.totalCostValue) : undefined,
              },
            ]}
          />

          <KpiCard
            className="sm:w-64 sm:shrink-0"
            label="Satış dəyəri"
            value={data ? fmtMoney(data.totalSaleValue) : undefined}
            sub={
              data ? (
                <span className="font-medium text-emerald-700">
                  Potensial qazanc: {fmtMoneySigned(data.potentialProfit)}
                </span>
              ) : undefined
            }
            isLoading={isLoading}
            isError={isError}
            onRetry={retry}
          />
        </div>

        {!isLoading && !isError && data && data.lowStockCount > 0 && (
          <AlertPill
            className="w-full justify-center lg:w-auto lg:shrink-0 lg:justify-start lg:self-start"
            onClick={onLowStockClick}
          >
            <AlertTriangle size={14} className="shrink-0" />
            {data.lowStockCount} mal azalır
          </AlertPill>
        )}
      </div>
    </div>
  );
}
