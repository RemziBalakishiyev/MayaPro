import { KpiCard, StatCluster } from "@/components/ui/KpiCard";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useDebtsKpi } from "@/features/reports/queries";
import { fmtMoney } from "@/lib/format";

interface Props {
  range: PeriodRange;
}

/**
 * Nisyə Borclar səhifəsi KPI kompozisiyası (FE#61, FE#56 üzərində yenidən
 * dizayn). `totalOutstanding/debtorCount/topDebtor/oldestDebtDays` anlıq
 * sahələrdir və "hazırda" nişanı əvəzinə sadəcə dövr sətrindən AYRI panel
 * kimi göstərilir. `periodNewDebt/periodCollected` isə yeganə dövrə bağlı
 * cütdür — PeriodFilter çiplərinin birbaşa altındakı "Bu dövrdə…" sətrində,
 * dövrlə eyni vizual qrupda yer alır.
 */
export function DebtsKpiCards({ range }: Props) {
  const { data, isLoading, isError, refetch } = useDebtsKpi(range);
  const retry = () => void refetch();

  return (
    <div className="mb-4">
      <p className="mb-4 min-h-[1rem] text-xs text-stone-500">
        {isLoading ? (
          <span className="inline-block h-3 w-56 animate-pulse rounded bg-stone-100 align-middle" />
        ) : isError ? (
          "Bu dövrdə: —"
        ) : (
          <>
            Bu dövrdə:{" "}
            <span className="font-semibold text-stone-700">
              {fmtMoney(data?.periodNewDebt)}
            </span>{" "}
            borc yarandı ·{" "}
            <span className="font-semibold text-stone-700">
              {fmtMoney(data?.periodCollected)}
            </span>{" "}
            ödəniş yığıldı
          </>
        )}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <StatCluster
          className="sm:flex-[2]"
          isLoading={isLoading}
          isError={isError}
          onRetry={retry}
          items={[
            {
              key: "outstanding",
              label: "Ümumi qalıq",
              value: data ? fmtMoney(data.totalOutstanding) : undefined,
            },
            {
              key: "debtors",
              label: "Borclu sayı",
              value: data?.debtorCount,
            },
            {
              key: "oldest",
              label: "Ən köhnə borc günü",
              value:
                data && data.oldestDebtDays != null
                  ? `${data.oldestDebtDays} gün`
                  : data
                    ? "-"
                    : undefined,
            },
          ]}
        />

        <KpiCard
          className="sm:w-64 sm:shrink-0"
          label="Ən böyük borclu"
          value={
            data
              ? data.topDebtor
                ? data.topDebtor.name
                : "Borclu yoxdur"
              : undefined
          }
          sub={data?.topDebtor ? fmtMoney(data.topDebtor.amount) : undefined}
          isLoading={isLoading}
          isError={isError}
          onRetry={retry}
        />
      </div>
    </div>
  );
}
