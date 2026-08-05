import { RefreshCw } from "lucide-react";
import type { PeriodRange } from "@/components/ui/period-filter-lib";
import { useDebtsKpi } from "@/features/reports/queries";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";

interface RangeProps {
  range: PeriodRange;
}

/**
 * FE#63 — dövr çiplərinin BİLAVASİTƏ altında, kart karkası olmadan kiçik
 * sətir: "Bu dövrdə: … borc yarandı · … ödəniş yığıldı". `BorclarPage`
 * bunu `PeriodFilter` ilə eyni "Dövr:" konteynerində göstərir ki, yalnız BU
 * sətrin dövrdən asılı olduğu vizual aydın olsun — `DebtsKpiCards`-dəki
 * digər rəqəmlər (ümumi qalıq/borclu sayı/ən köhnə borc/ən çox borclu)
 * "hazırda" anlıq sahələrdir və dövrdən TƏSİRLƏNMİR.
 *
 * FE#65 — dövr çipi dəyişəndə `useDebtsKpi` `placeholderData` ilə köhnə
 * nəticəni saxlayır, buna görə YALNIZ bu sətir `isFetching`-ə görə skeleton
 * göstərir.
 */
export function DebtsPeriodLine({ range }: RangeProps) {
  const { data, isFetching, isError } = useDebtsKpi(range);

  return (
    <p className="min-h-[1rem] text-xs text-stone-500">
      {isFetching ? (
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
  );
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-red-600">Yüklənmədi</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
      >
        <RefreshCw size={12} />
        Yenidən
      </button>
    </div>
  );
}

interface DebtsKpiCardsProps extends RangeProps {
  /**
   * "Ən çox borclu" mini-kartına klik ediləndə çağrılır (topDebtor adı ilə)
   * — cədvəli həmin müştəriyə filtrləmək üçün (FE#63, klik funksional
   * olmalıdır, statik dekorasiya deyil).
   */
  onSelectDebtor?: (name: string) => void;
}

/**
 * Nisyə Borclar səhifəsi KPI kompozisiyası (FE#63 — Satış səhifəsindəki
 * "SATIŞ + QAZANC" dilinin davamı).
 *
 * "BORC VƏZİYYƏTİ" — birləşik panel (anlıq): ÜMUMİ QALIQ panelin ulduzudur
 * (ən böyük rəqəm, solda), sağda incə ayırıcı ilə Borclu sayı · Ən köhnə
 * borc (60+ gün qırmızı ilə vurğulanır). "Hazırda" nişanı YOXDUR — bu
 * panelin BÜTÜN sahələri həmişə anlıqdır, ayrıca vurğuya ehtiyac yoxdur.
 *
 * "ƏN ÇOX BORCLU" — ayrıca, kliklənə bilən mini-kart: ad + məbləğ, klik
 * ediləndə cədvəl həmin müştəriyə filtrlənir (`onSelectDebtor`).
 */
export function DebtsKpiCards({ range, onSelectDebtor }: DebtsKpiCardsProps) {
  const { data, isLoading, isError, refetch } = useDebtsKpi(range);
  const retry = () => void refetch();

  const oldestDays = data?.oldestDebtDays ?? null;
  const oldestTone = oldestDays != null && oldestDays >= 60 ? "text-red-600" : "text-stone-900";
  const topDebtor = data?.topDebtor ?? null;
  const canSelectDebtor = !!topDebtor && !!onSelectDebtor;

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
      {/* BORC VƏZİYYƏTİ */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card sm:flex-[2]">
        {isError ? (
          <ErrorBlock onRetry={retry} />
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* ÜMUMİ QALIQ — panelin ulduzu, ən böyük rəqəm */}
            <div className="sm:w-40 sm:shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Ümumi qalıq
              </span>
              {isLoading ? (
                <div className="mt-1.5 h-8 w-2/3 animate-pulse rounded bg-stone-200" />
              ) : (
                <p className="mt-1 whitespace-nowrap text-2xl font-bold tabular-nums leading-tight text-red-600 lg:text-3xl">
                  {fmtMoney(data?.totalOutstanding)}
                </p>
              )}
            </div>

            {/* Borclu sayı / Ən köhnə borc — incə ayırıcı ilə */}
            <div className="flex min-w-0 flex-1 flex-col divide-y divide-stone-100 border-t border-stone-100 pt-3 sm:flex-row sm:divide-x sm:divide-y-0 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
              <div className="py-2.5 first:pt-0 sm:flex-1 sm:px-4 sm:py-0 sm:first:pl-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Borclu sayı
                </span>
                {isLoading ? (
                  <div className="mt-1.5 h-6 w-2/3 animate-pulse rounded bg-stone-200" />
                ) : (
                  <p className="mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-stone-900 lg:text-2xl">
                    {data?.debtorCount}
                  </p>
                )}
              </div>
              <div className="py-2.5 sm:flex-1 sm:px-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Ən köhnə borc günü
                </span>
                {isLoading ? (
                  <div className="mt-1.5 h-6 w-2/3 animate-pulse rounded bg-stone-200" />
                ) : (
                  <p
                    className={cn(
                      "mt-1 whitespace-nowrap text-xl font-bold tabular-nums leading-tight lg:text-2xl",
                      oldestTone,
                    )}
                  >
                    {oldestDays != null ? `${oldestDays} gün` : "-"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ƏN ÇOX BORCLU — ayrıca mini-kart, klik funksional */}
      <button
        type="button"
        onClick={() => topDebtor && onSelectDebtor?.(topDebtor.name)}
        disabled={!canSelectDebtor}
        aria-label={
          topDebtor ? `${topDebtor.name} üzrə filtrlə` : "Ən çox borclu"
        }
        className={cn(
          "rounded-2xl border border-stone-200 bg-white p-4 text-left shadow-card transition-colors sm:w-64 sm:shrink-0",
          canSelectDebtor &&
            "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/40 active:scale-[0.99]",
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Ən çox borclu
        </span>
        {isError ? (
          <div className="mt-2">
            <ErrorBlock onRetry={retry} />
          </div>
        ) : isLoading ? (
          <div className="mt-2 space-y-1.5">
            <div className="h-6 w-2/3 animate-pulse rounded bg-stone-200" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-stone-100" />
          </div>
        ) : (
          <>
            <p className="mt-1 truncate whitespace-nowrap text-xl font-bold tabular-nums leading-tight text-stone-900 lg:text-2xl">
              {topDebtor ? topDebtor.name : "Borclu yoxdur"}
            </p>
            {topDebtor && (
              <p className="mt-0.5 text-xs text-stone-500">
                {fmtMoney(topDebtor.amount)}
              </p>
            )}
          </>
        )}
      </button>
    </div>
  );
}
