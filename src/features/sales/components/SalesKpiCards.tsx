import { AlertTriangle, RefreshCw } from "lucide-react";
import { StatCluster } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useSalesKpi } from "@/features/reports/queries";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import type { PaymentType } from "@/types";
import type { PaymentTypeKpi } from "@/features/reports/api";

interface Props {
  range: PeriodRange;
}

const profitFor = (
  byPayment: PaymentTypeKpi[] | undefined,
  type: PaymentType,
): number => byPayment?.find((p) => p.type === type)?.profit ?? 0;

/** Nağd/Kart/Nisyə mini-bar rəngləri — Badge-dəki eyni ödəniş rəngləri (FE#62). */
const PAYMENT_TONE: Record<PaymentType, { bar: string; text: string }> = {
  Nağd: { bar: "bg-emerald-500", text: "text-emerald-700" },
  Kart: { bar: "bg-sky-500", text: "text-sky-700" },
  Nisyə: { bar: "bg-orange-500", text: "text-orange-800" },
};

const PAYMENT_TYPES: PaymentType[] = ["Nağd", "Kart", "Nisyə"];

/**
 * Satış jurnalı üstü KPI kompozisiyası (FE#62 — FE#61 dilinin davamı).
 *
 * 7 bərabər kart əvəzinə 2 blok:
 * - "SATIŞ" birləşik paneli: Satış sayı · Ümumi satış · Orta satış (incə
 *   ayırıcılarla — Mallar səhifəsindəki StatCluster patterni, FE#61).
 * - "QAZANC" paneli (cəm-hissə hekayəsi): solda ÜMUMİ QAZANC panelin
 *   ulduzudur (ən böyük rəqəm); sağda Nağd/Kart/Nisyə bölgüsü hər biri öz
 *   rəngində mini-bar ilə, ümumi qazancın faizi kimi göstərilir — beləliklə
 *   "Ümumi = Nağd+Kart+Nisyə" əlaqəsi vizual olaraq hiss olunur.
 *
 * Bütün sahələr eyni dövrə (jurnal filtri ilə paylaşılan `range`) bağlıdır,
 * buna görə ayrıca "hazırda" ayrımına ehtiyac yoxdur.
 */
export function SalesKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useSalesKpi(range);
  const retry = () => void refetch();

  const totalProfit = data?.totalProfit ?? 0;
  const breakdown = PAYMENT_TYPES.map((type) => ({
    type,
    profit: profitFor(data?.byPayment, type),
  }));

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
      {/* SATIŞ paneli */}
      <StatCluster
        className="lg:flex-1"
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
            key: "avg",
            label: "Orta satış",
            value: data ? fmtMoney(data.avgSale) : undefined,
          },
        ]}
      />

      {/* QAZANC paneli — hekayəli kompozisiya */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card lg:flex-[1.4]">
        {isError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-red-600">Yüklənmədi</p>
            <button
              type="button"
              onClick={retry}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw size={12} />
              Yenidən
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* ÜMUMİ QAZANC — panelin ulduzu, ən böyük rəqəm */}
            <div className="sm:w-40 sm:shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Ümumi qazanc
              </span>
              {isLoading ? (
                <div className="mt-1.5 h-8 w-2/3 animate-pulse rounded bg-stone-200" />
              ) : (
                <p className="mt-1 whitespace-nowrap text-2xl font-bold tabular-nums leading-tight text-emerald-700 lg:text-3xl">
                  {fmtMoney(totalProfit)}
                </p>
              )}
            </div>

            {/* Bölgü — Nağd/Kart/Nisyə, hər biri öz rəngində mini-bar (tam en) */}
            <div className="min-w-0 flex-1 space-y-2.5 border-t border-stone-100 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              {breakdown.map(({ type, profit }) => {
                const pct =
                  totalProfit > 0
                    ? Math.min(100, Math.max(0, (profit / totalProfit) * 100))
                    : 0;
                const tone = PAYMENT_TONE[type];
                return (
                  <div key={type}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                      <span className={cn("font-semibold", tone.text)}>
                        {type}
                      </span>
                      {isLoading ? (
                        <span className="h-3 w-14 animate-pulse rounded bg-stone-100" />
                      ) : (
                        <span className="font-bold tabular-nums text-stone-700">
                          {fmtMoney(profit)}
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                      {!isLoading && (
                        <div
                          className={cn(
                            "h-full rounded-full transition-[width] duration-200 ease-out",
                            tone.bar,
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AC18 — naməlum qazanclı satış varsa panel altında kiçik boz qeyd */}
        {!isLoading && !isError && data && data.unknownProfitSalesCount > 0 && (
          <p className="mt-3 flex items-center gap-1.5 border-t border-stone-100 pt-2.5 text-xs text-stone-500">
            <AlertTriangle size={12} className="shrink-0 text-amber-600" />
            {data.unknownProfitSalesCount} satış naməlum,{" "}
            {fmtMoney(data.unknownProfitAmount)} daxil edilməyib
          </p>
        )}
      </div>
    </div>
  );
}
