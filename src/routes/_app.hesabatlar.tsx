import { useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TrendingDown, Snowflake, AlertTriangle, Check } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/KpiCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";
import { StaleDataBanner } from "@/components/ui/StaleDataBanner";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import {
  matchQuickPeriod,
  quickPeriodRange,
  formatRangeChip,
  isoInRange,
  QUICK_PERIODS,
  type PeriodRange,
} from "@/components/ui/period-filter-lib";
import { fmtMoney } from "@/lib/format";
import { useReportsData, useSummary } from "@/features/reports/queries";
import { salesMoneySplit } from "@/features/sales/lib";
import {
  sumBy,
  dailySeries,
  weeklySeries,
  expenseByCategory,
  topProductsByQty,
  frozenProducts,
  lossSellers,
  paymentBreakdown,
  type Period,
} from "@/features/reports/lib";
import {
  expenseBySource,
  expenseSourceSummaryText,
} from "@/features/expenses/lib";
import { DailyBarChart } from "@/features/reports/components/DailyBarChart";
import { TrendLineChart } from "@/features/reports/components/TrendLineChart";
import { ExpensePie } from "@/features/reports/components/ExpensePie";
import { TopProductsBar } from "@/features/reports/components/TopProductsBar";
import { PaymentBreakdown } from "@/features/reports/components/PaymentBreakdown";

/**
 * FE#78 — köhnə `?period=today|week|month|all` linkləri (bax
 * `docs/ui-refactor-roadmap.md`, Mərhələ 2A/2A.3). Standart `PeriodFilter`
 * `from`/`to` aralığı istifadə etdiyi üçün bu açar YALNIZ mount zamanı
 * oxunur, uyğun aralığa çevrilir və URL-dən silinir (aşağı, `useEffect`).
 */
const LEGACY_PERIODS = ["today", "week", "month", "all"] as const;

const searchSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  period: z.enum(LEGACY_PERIODS).optional().catch(undefined),
});

export const Route = createFileRoute("/_app/hesabatlar")({
  validateSearch: searchSchema,
  component: HesabatlarPage,
});

function HesabatlarPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  // FE#78 — dəyər HƏMİŞƏ (render zamanı, effekt gözləmədən) tam həll olunur:
  // URL-də `from`/`to` varsa ONLAR; yoxdursa köhnə `?period=` linki (varsa)
  // uyğun aralığa çevrilir; heç biri yoxdursa defolt "Bu ay" (əvvəlki
  // `z.object({period}).default("month")` davranışı ilə EYNİ). Bu, `range`-i
  // ASENKRON bir effektin nəticəsini gözləmədən dərhal DÜZGÜN göstərir və
  // (mühüm) `PeriodFilter`-in ÖZ mount-defolt effekti ilə YARIŞA girmir —
  // ona görə aşağıda `PeriodFilter`ə `defaultKey` VERİLMİR (component öz
  // daxili defoltunu, "all"ı, İŞLƏTMİR, çünki bu hesablama onu artıq
  // ötürüb — bax `PeriodFilter` çağırışı, aşağıda).
  const range: PeriodRange =
    search.from || search.to
      ? { from: search.from, to: search.to }
      : search.period
        ? quickPeriodRange(search.period)
        : quickPeriodRange("month");
  const { data, isLoading, isError, refetch } = useReportsData();

  // Yuxarıdakı `range` artıq render zamanı düzgün dəyəri göstərir — bu effekt
  // YALNIZ URL-i həmin dəyərlə sinxronlaşdırır (köhnə `?period=` açarını
  // silir, boş URL-ə defolt "Bu ay"nı yazır) ki, deep-link/refresh zamanı da
  // eyni nəticə alınsın (AC2 naxışı). Bir dəfə, ilk mount-da — istifadəçi
  // sonra `PeriodFilter`dən şüurlu seçim etdikdə bu YENİDƏN İŞƏ DÜŞMÜR.
  useEffect(() => {
    if (search.from || search.to) return;
    navigate({
      search: (prev) => ({ ...prev, period: undefined, from: range.from, to: range.to }),
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateRange = (patch: PeriodRange) =>
    navigate({
      search: (prev) => ({ ...prev, from: patch.from, to: patch.to, period: undefined }),
    });

  // Seçilmiş aralıq sabit "Bu gün/Bu həftə/Bu ay/Bu il/Hamısı" çiplərindən
  // birinə uyğun gəlirmi? Uyğun gəlirsə server `/api/reports/summary?period=`
  // (backend kontraktı DƏYİŞMƏYİB — yalnız bu sabit açarları qəbul edir)
  // çağırılır; "Keçən ay" və ya sərbəst tarix aralığında YOX — bu halda
  // `useSummary` sükutla keçilir (`enabled: false`) və aşağıdaki lokal
  // fallback (`expenseBySource`) istifadə olunur (dəyər/hesablama EYNİDİR).
  const matchedKey = matchQuickPeriod(range);
  const summaryPeriod: Period | undefined =
    matchedKey && matchedKey !== "lastMonth" ? matchedKey : undefined;
  // Xərc mənbəyi bölgüsü (Ümumi/Mala bağlı) üçün server summary — mövcud olduqda
  // ONDAN istifadə olunur (Xərclər səhifəsi ilə eyni rəqəm, FE#9/AC1-AC2).
  const { data: summary } = useSummary(summaryPeriod);

  // Chart başlıqlarında göstərilən oxunan dövr adı — YENİ analitika DEYİL,
  // artıq mövcud olan `range`-dən çıxarılan mətn (bənd #5, "aydın başlıq").
  const periodLabel = useMemo(() => {
    if (matchedKey) {
      return QUICK_PERIODS.find((p) => p.key === matchedKey)?.label ?? "Bu dövr";
    }
    if (range.from && range.to) return formatRangeChip(range.from, range.to);
    return "Bu dövr";
  }, [matchedKey, range.from, range.to]);

  const view = useMemo(() => {
    if (!data) return null;
    const { products, sales, expenses } = data;
    const periodSales = sales.filter((s) => isoInRange(s.createdAt, range.from, range.to));
    const periodExpenses = expenses.filter((e) => isoInRange(e.date, range.from, range.to));

    // Xərc mənbəyi bölgüsü: server summary-də HƏR İKİ sahə ƏDƏD olduqda onlardan
    // götürülür (0 legitim dəyərdir — ona görə truthy yox, `typeof` yoxlaması).
    // Sahələr yoxdursa/ədəd deyilsə (köhnə backend, sorğu alınmadı və ya hələ
    // gəlməyib) xam xərc siyahısından lokal hesablanır — səhifə sınmır (AC3).
    const srvGeneral = summary?.generalExpenses;
    const srvProduct = summary?.productExpenses;
    const expBySource =
      typeof srvGeneral === "number" && typeof srvProduct === "number"
        ? { general: srvGeneral, product: srvProduct }
        : expenseBySource(periodExpenses);
    // "Xərc" başlıq rəqəmi elə bu bölgünün cəmidir — beləcə cəm invariantı HƏR İKİ
    // qolda (server və lokal) struktur olaraq qorunur (AC4), ayrıca hesablanan
    // ikinci cəm yoxdur ki, ondan fərqlənsin.
    const expensesTotal = expBySource.general + expBySource.product;

    const periodMoney = salesMoneySplit(periodSales);

    const frozen = frozenProducts(products, sales);
    const frozenGroups = [30, 60, 90].map((days) => {
      const items = frozen.filter(
        (p) =>
          p.idleDays >= days && p.idleDays < (days === 90 ? Infinity : days + 30),
      );
      return { days, items, total: sumBy(items, (p) => p.frozenValue) };
    });

    const topBar = topProductsByQty(periodSales, products)
      .slice(0, 6)
      .map(({ product, qty }) => ({
        name: product.name.length > 18 ? product.name.slice(0, 17) + "…" : product.name,
        qty,
      }));

    return {
      sales: sumBy(periodSales, (s) => s.totalAmount),
      profit: sumBy(periodSales, (s) => s.profit ?? 0),
      expenses: expensesTotal,
      stockValue: sumBy(products, (p) => p.realCostPerUnit * p.quantity),
      // BE#19 qaydası: nağd = faktiki alınan pul, nisyə = yalnız qalıq borc
      // (qismən ödənilmiş satışda tam yekun deyil) — server summary ilə eyni.
      cashSales: periodMoney.cash,
      creditSales: periodMoney.credit,
      // Günlük/həftəlik trend HƏMİŞƏ son 14 gün/6 həftədir — seçilmiş dövr
      // filtrindən ASILI DEYİL (əvvəlki davranış, dəyişməyib: `sales` xam
      // massivdən, `periodSales`-dən DEYİL).
      daily: dailySeries(sales, 14),
      weekly: weeklySeries(sales, 6),
      expByCat: expenseByCategory(periodExpenses),
      expBySource,
      topBar,
      payments: paymentBreakdown(periodSales),
      leastSold: [...topProductsByQty(periodSales, products)].reverse().slice(0, 5),
      frozen,
      frozenGroups,
      frozenTotal: sumBy(frozen, (p) => p.frozenValue),
      lossSellers: lossSellers(products),
    };
  }, [data, range.from, range.to, summary]);

  // FE#142 (TC-32): xəta vəziyyəti yüklənmə/boş vəziyyətdən ƏVVƏL yoxlanılır —
  // şəbəkə/server xətasında sonsuz spinner ƏVƏZİNƏ InlineError + "Yenidən"
  // göstərilir. AMMA yalnız `view` (hesablanmış hesabat datası) HEÇ VAXT
  // uğurla yüklənməyibsə (`data === undefined`). Əvvəl uğurla yüklənmiş data
  // varkən arxa-fon refetch-i uğursuz olarsa, TanStack Query `data`-nı
  // ƏVVƏLKİ nəticə ilə saxlayır — bu halda artıq göstəriləcək DOĞRU hesabat
  // var, ona görə onu tam InlineError ekranı ilə əvəz ETMİRİK (aşağıda kiçik
  // xəbərdarlıq zolağı ilə göstərilir).
  if (isError && !view) {
    return (
      <div>
        <PageHeader title="Hesabatlar" subtitle="Satış və qazanc analitikası" />
        <InlineError
          message="Hesabatlar yüklənmədi"
          hint="Şəbəkə və ya server cavab vermədi."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (isLoading || !view) {
    return (
      <div>
        <PageHeader title="Hesabatlar" subtitle="Satış və qazanc analitikası" />
        <PageSkeleton label="Hesabatlar yüklənir" cardCount={4} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Hesabatlar"
        subtitle="Satış, qazanc və xərc analitikası"
      />

      {/* FE#78 (bənd #4) — dövr seçimi standart səhifə toolbar-ında
          (`SegmentedDateFilter`/`PeriodFilter`), Mallar/Xərclər/Satış/Nisyə
          Borclar səhifələri ilə EYNİ yerdə və görünüşdə. Köhnə düymə qrupu
          SİLİNDİ. `defaultKey` QƏSDƏN ötürülmür — defolt "Bu ay" artıq
          yuxarıdakı `range` hesablamasında tətbiq olunub (yuxarı bax); əks
          halda `PeriodFilter`in öz mount-defolt effekti bizim köhnə `period`
          keçidimizlə eyni anda işə düşüb YARIŞA girərdi. */}
      <PeriodFilter value={range} onChange={updateRange} />

      {/* FE#142: arxa-fon refetch xətası — mövcud (köhnə/keçərli) hesabat
          görünməyə davam edir, sadəcə üstündə xəbərdarlıq zolağı var. */}
      {isError && (
        <StaleDataBanner
          message="Hesabatlar yenilənmədi — göstərilən məlumat köhnəlmiş ola bilər."
          onRetry={() => void refetch()}
        />
      )}

      {/* FE#78 (bənd #1/#2/#3) — 6 KPI `KpiCard` (StatCard-dan fərqli, daha
          kompakt dizayn primitivi — `text-xl lg:text-2xl` + `money` sinfi,
          bax `docs/design-system.md` §1.5) ilə TƏK responsiv grid-də: mobil
          2 sütun (3 sıra), `sm`-dən 3 (2 sıra), `lg`-dən 4 sütun (2 sıra:
          4+2) — heç bir kart qonşusunun üstünə minmir, böyük məbləğ kəsilmir
          (money = min-w-0 + overflow-hidden + truncate, tam dəyər `title`-də). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Satış" value={fmtMoney(view.sales)} />
        <KpiCard label="Xalis qazanc" value={fmtMoney(view.profit)} tone="green" />
        <KpiCard
          label="Xərc"
          value={fmtMoney(view.expenses)}
          sub={expenseSourceSummaryText(view.expBySource)}
          tone="red"
        />
        <KpiCard label="Anbar dəyəri" value={fmtMoney(view.stockValue)} />
        <KpiCard label="Nağd satış" value={fmtMoney(view.cashSales)} />
        <KpiCard label="Nisyə satış" value={fmtMoney(view.creditSales)} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış + qazanc (son 14 gün)">
          <DailyBarChart data={view.daily} showProfit />
        </Card>
        <Card title="Həftəlik qazanc trendi (son 6 həftə)">
          {/* FE#78 (bənd #6) — "H1, H2, H3" ƏVƏZİNƏ real tarix aralığı
              ("28.07 – 03.08"); `wideLabels` bu geniş etiketlərin
              kəsişmədən görünməsi üçün (bənd #8). */}
          <TrendLineChart data={view.weekly} xKey="label" wideLabels />
        </Card>
        <Card title={`Xərc kateqoriyaları (${periodLabel})`}>
          <ExpensePie data={view.expByCat} />
        </Card>
        <Card title={`Ən çox satılan mallar (${periodLabel})`}>
          <TopProductsBar data={view.topBar} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Nağd / Kart / Nisyə müqayisəsi (${periodLabel})`}>
          <PaymentBreakdown data={view.payments} />
        </Card>
        <Card title={`Ən az satılan mallar (${periodLabel})`}>
          {view.leastSold.length === 0 ? (
            <EmptyState embedded icon={TrendingDown} title="Satış datası yoxdur" />
          ) : (
            <div className="space-y-2.5">
              {view.leastSold.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center gap-2.5">
                  <TrendingDown size={14} className="text-stone-400" />
                  <span className="flex-1 truncate text-sm text-stone-700">
                    {product.name}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-stone-500">
                    {qty} əd.
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Satılmayan mallar (30/60/90 gün)">
          {view.frozen.length === 0 ? (
            <EmptyState embedded icon={Snowflake} title="Donmuş mal yoxdur" />
          ) : (
            <div className="space-y-4">
              {view.frozenGroups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.days}>
                      <p className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-sky-700">
                        <span>{g.days}+ gün satılmır</span>
                        <span className="tabular-nums">{fmtMoney(g.total)}</span>
                      </p>
                      {g.items.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 py-1">
                          <Snowflake size={13} className="text-sky-400" />
                          <span className="flex-1 truncate text-sm text-stone-700">
                            {p.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {p.quantity} əd.
                          </span>
                          <span className="w-24 text-right text-sm font-bold tabular-nums text-sky-700">
                            {fmtMoney(p.frozenValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ),
              )}
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                Cəmi dondurulmuş pul: {fmtMoney(view.frozenTotal)}
              </p>
            </div>
          )}
        </Card>

        <Card title="Ziyana satılan mallar">
          {view.lossSellers.length === 0 ? (
            <EmptyState embedded icon={Check} title="Ziyana satılan mal yoxdur" />
          ) : (
            <div className="space-y-2.5">
              {view.lossSellers.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      maya {fmtMoney(p.realCostPerUnit)} → satış {fmtMoney(p.salePrice)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-rose-600">
                    −{fmtMoney((p.realCostPerUnit - p.salePrice) * p.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
