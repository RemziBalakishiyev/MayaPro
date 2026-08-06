import { AlertTriangle, RefreshCw } from "lucide-react";
import { StatCluster } from "@/components/ui/KpiCard";
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
 * Satış jurnalı üstü KPI kompozisiyası (FE#61, FE#56, FE#71 üzərində yenidən
 * dizayn) — jurnal filtri ilə eyni PeriodFilter aralığını paylaşır, bütün
 * sahələr artıq dövrə bağlı olduğu üçün ayrıca "hazırda" ayrımına ehtiyac
 * yoxdur.
 *
 * FE#71 (AC-6/AC-7) — birinci səviyyə xülasə TƏK birləşik panelə
 * sadələşdirilib: Satış sayı · Ümumi satış · Ümumi qazanc · Orta satış (əvvəl
 * "Orta satış" ayrıca yan `KpiCard`-da idi). Nağd/Kart/Nisyə üzrə qazanc
 * bölgüsü İKİNCİ DƏRƏCƏLİ, vizual olaraq kiçik panel kimi altında qalır —
 * `StatCluster`/`KpiCard`-ın böyük (text-xl/2xl) rəqəm tipoqrafiyası əvəzinə
 * yığcam (text-sm) sətir istifadə olunur.
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

  const byPaymentItems: Array<{ key: string; label: string; value: number }> = [
    { key: "cash", label: "Nağd qazanc", value: profitFor(data?.byPayment, "Nağd") ?? 0 },
    { key: "card", label: "Kart qazanc", value: profitFor(data?.byPayment, "Kart") ?? 0 },
    { key: "credit", label: "Nisyə qazanc", value: profitFor(data?.byPayment, "Nisyə") ?? 0 },
  ];

  return (
    <div className="mb-3 space-y-2">
      {/* Birinci səviyyə — TƏK birləşik panel, dəqiq 4 göstərici (AC-6). */}
      <StatCluster
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
          {
            key: "avg",
            label: "Orta satış",
            value: data ? fmtMoney(data.avgSale) : undefined,
          },
        ]}
      />

      {/* İkinci dərəcəli — Nağd/Kart/Nisyə bölgüsü, əsas paneldən vizual
          olaraq kiçik (AC-7). Eyni sorğudan gəldiyi üçün loading/error
          vəziyyəti əsas panellə paralel göstərilir. */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2.5">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
          Ödəniş növü üzrə qazanc
        </p>
        {isError ? (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-red-600">Yüklənmədi</p>
            <button
              type="button"
              onClick={retry}
              className="focus-ring inline-flex min-h-[40px] shrink-0 items-center gap-1 rounded-chip bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <RefreshCw size={12} />
              Yenidən
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 divide-x divide-stone-200">
            {byPaymentItems.map((item) => (
              <div key={item.key} className="min-w-0 px-2 text-center first:pl-0 last:pr-0">
                <span className="block truncate text-[11px] text-stone-500">
                  {item.label}
                </span>
                {isLoading ? (
                  <div className="mx-auto mt-1 h-4 w-2/3 animate-pulse rounded bg-stone-200" />
                ) : (
                  <span className="block truncate text-sm font-bold tabular-nums text-stone-800">
                    {fmtMoney(item.value)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
