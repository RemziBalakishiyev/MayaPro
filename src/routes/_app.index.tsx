import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  TrendingUp,
  BarChart3,
  HandCoins,
  Users,
  Truck,
  AlertTriangle,
  Snowflake,
  Lock,
  Clock,
  Check,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { StatCluster } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";
import { StaleDataBanner } from "@/components/ui/StaleDataBanner";
import { PageSkeleton } from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtMoneySigned, fmtDate } from "@/lib/format";
import { useDashboardStats, useDebtsKpi } from "@/features/reports/queries";
import { useTodayClosing } from "@/features/day-end/queries";
import { DailyBarChart } from "@/features/reports/components/DailyBarChart";
import { TrendLineChart } from "@/features/reports/components/TrendLineChart";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

/**
 * FE#72 (② Diqqət bölməsi) — bir qrafikin "kifayət qədər" data ilə göstərilib
 * göstərilməyəcəyini təyin edən həddlər. Yalnız TƏQDİMAT qərarıdır: `daily`/
 * `monthly` massivləri `useDashboardStats()`-dan olduğu kimi gəlir, burada
 * YALNIZ neçə nöqtənin sıfırdan fərqli olduğuna baxılır (AC-6/AC-7).
 */
const MIN_DAILY_POINTS = 3;
const MIN_MONTHLY_POINTS = 2;

type AttentionTone = "amber" | "green" | "indigo";

const ATTENTION_TONE: Record<AttentionTone, string> = {
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  indigo: "bg-indigo-50 text-indigo-600",
};

/** ② Diqqət bölməsi sətri — vizual gövdə. Naviqasiya HƏR yerdə mövcud
 * `<Link>` ilə çağıran tərəfdən verilir ki, TanStack Router-in tipli
 * `to`/`search` yoxlaması hər hədəf üçün ayrıca qorunsun (F-72). */
function AttentionContent({
  icon: Icon,
  tone,
  title,
  sub,
}: {
  icon: LucideIcon;
  tone: AttentionTone;
  title: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          ATTENTION_TONE[tone],
        )}
      >
        <Icon size={16} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-stone-800">
          {title}
        </span>
        {sub && (
          <span className="block truncate text-xs text-stone-500">{sub}</span>
        )}
      </span>
      <ChevronRight
        size={16}
        aria-hidden
        className="shrink-0 text-stone-300 transition group-hover:translate-x-0.5 group-hover:text-stone-400"
      />
    </>
  );
}

/** Hər ② sətri kliklənəndir (kursor + ox işarəsi) — AC-5. */
const attentionRowCls =
  "focus-ring group flex items-center gap-3 rounded-xl py-2.5 pr-1 text-left transition hover:bg-stone-50 active:scale-[0.99]";

/** Kifayət qədər data yoxdursa göstərilən paylaşılan boş vəziyyət (AC-6/AC-7). */
function ChartEmptyState({ icon }: { icon: LucideIcon }) {
  return (
    <EmptyState
      embedded
      icon={icon}
      title="Hələ kifayət qədər məlumat yoxdur"
      hint="Bir neçə gün satışdan sonra burada qrafik görünəcək."
    />
  );
}

function DashboardPage() {
  const { data: d, isLoading, isError, refetch } = useDashboardStats();
  // ② — mövcud, artıq başqa səhifələrdə istifadə olunan sorğular (yeni
  // backend davranışı YOXDUR): borclu sayı üçün Nisyə Borclar KPI-si,
  // bağlanış statusu üçün Gün Sonu sorğusu. Hər ikisi əlavə (bezel)
  // siqnaldır — uğursuz/yüklənməkdə olsalar belə əsas Dashboard bloklanmır.
  const { data: debtsKpi } = useDebtsKpi({});
  const { data: todayClosing, isSuccess: closingLoaded } = useTodayClosing();

  // FE#142 (TC-32): xəta vəziyyəti yüklənmə/boş vəziyyətdən ƏVVƏL yoxlanılır —
  // şəbəkə/server xətasında sonsuz spinner ƏVƏZİNƏ InlineError + "Yenidən"
  // göstərilir. AMMA yalnız `d` (dashboard datası) HEÇ VAXT uğurla
  // yüklənməyibsə (`data === undefined`). Əvvəl uğurla yüklənmiş data varkən
  // arxa-fon refetch-i uğursuz olarsa, TanStack Query `data`-nı ƏVVƏLKİ
  // nəticə ilə saxlayır — bu halda artıq göstəriləcək DOĞRU dashboard var,
  // ona görə onu tam InlineError ekranı ilə əvəz ETMİRİK (aşağıda kiçik
  // xəbərdarlıq zolağı ilə göstərilir).
  if (isError && !d) {
    return (
      <div>
        <PageHead title="Dashboard" subtitle="Bugünkü vəziyyət bir baxışda" />
        <InlineError
          message="Dashboard yüklənmədi"
          hint="Şəbəkə və ya server cavab vermədi."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (isLoading || !d) {
    return (
      <div>
        <PageHead title="Dashboard" subtitle="Bugünkü vəziyyət bir baxışda" />
        <PageSkeleton
          label="Dashboard yüklənir"
          statCount={4}
          statGridClassName="grid-cols-2 md:grid-cols-4"
        />
      </div>
    );
  }

  // ① Əsas icmal — "Bugünkü real qazanc" altında sadə bazar dilində izah:
  // nisyə hissəsi hələ nağd deyil (AC-3/AC-4, R-19 "kağız üzərində qazanc"
  // adının vahidləşməsi). `paperProfit === todayProfit` (eyni rəqəm, TƏK
  // yerdə göstərilir) — köhnə `SignatureBand`-in ikinci kartı SİLİNİB.
  const hasCreditNote = d.todayCredit > 0;
  const hasUnknownNote = d.unknownProfitSalesCount > 0;
  const profitSub =
    hasCreditNote || hasUnknownNote ? (
      <>
        {hasCreditNote && (
          <span className="block">
            Bunun {fmtMoney(d.todayCredit)} hissəsi nisyədə — nisyə
            satdıqların hələ cibində deyil.
          </span>
        )}
        {hasUnknownNote && (
          <span className="mt-0.5 block font-semibold text-amber-700">
            {d.unknownProfitSalesCount} satışın qazancı naməlum (
            {fmtMoney(d.unknownProfitAmount)} satış)
          </span>
        )}
      </>
    ) : undefined;

  // ② Diqqət bölməsi — hər sətir mövcud səhifə/filtrə keçiddir, yeni məntiq
  // YOXDUR (AC-5). Neçəsi göründüyünü sayır ki, heç biri yoxdursa müsbət
  // boş vəziyyət göstərilsin.
  const totalFrozenValue = d.frozen.reduce((s, p) => s + p.frozenValue, 0);
  const attentionCount =
    (d.lowStock.length > 0 ? 1 : 0) +
    (d.receivables > 0 ? 1 : 0) +
    (d.payables > 0 ? 1 : 0) +
    (closingLoaded ? 1 : 0) +
    (d.frozen.length > 0 ? 1 : 0);

  const closingDiff = todayClosing?.difference ?? 0;

  // ③ İkinci dərəcəli detallar — kiçik/sakit panel (SalesKpiCards ikinci
  // dərəcəli panel dili, FE#71).
  const paymentSplit = [
    { key: "cash", label: "Nağd satış", value: d.todayCash },
    { key: "card", label: "Kart satış", value: d.todayCard },
    { key: "credit", label: "Nisyə satış", value: d.todayCredit },
  ];
  const stockAndDebts = [
    { key: "stock", label: "Anbardakı malın dəyəri", value: d.stockValue },
    { key: "receivables", label: "Mənə borcu olanlar", value: d.receivables },
    { key: "payables", label: "Mənim borcum", value: d.payables },
  ];

  // ⑥/⑦ — chartlar yalnız kifayət qədər data olduqda göstərilir (AC-6/AC-7).
  const hasDailyData =
    d.daily.filter((p) => p.satis > 0).length >= MIN_DAILY_POINTS;
  const hasMonthlyData =
    d.monthly.filter((p) => p.qazanc !== 0).length >= MIN_MONTHLY_POINTS;

  return (
    <div className="space-y-5">
      <PageHead title="Dashboard" subtitle="Bugünkü vəziyyət bir baxışda" />

      {/* FE#142: arxa-fon refetch xətası — mövcud (köhnə/keçərli) dashboard
          görünməyə davam edir, sadəcə üstündə xəbərdarlıq zolağı var. */}
      {isError && (
        <StaleDataBanner
          message="Dashboard yenilənmədi — göstərilən məlumat köhnəlmiş ola bilər."
          onRetry={() => void refetch()}
        />
      )}

      {/* ① ƏSAS İCMAL — ən böyük, dərhal görünən TƏK panel (AC-1/AC-2).
          Eyni kassa rəqəmi (`expectedCash`) artıq YALNIZ burada göstərilir —
          köhnə iç-içə tünd-yaşıl `SignatureBand` SİLİNDİ. */}
      <StatCluster
        items={[
          {
            key: "expectedCash",
            label: "Kassada olmalı",
            value: fmtMoney(d.expectedCash),
            sub: `Başlanğıc ${fmtMoney(d.openingCash)} + nağd satış ${fmtMoney(
              d.todayCash,
            )} − xərc ${fmtMoney(d.todayExpenses)}`,
          },
          {
            key: "todayTotal",
            label: "Bugünkü satış",
            value: fmtMoney(d.todayTotal),
          },
          {
            key: "todayExpenses",
            label: "Bugünkü xərc",
            value: fmtMoney(d.todayExpenses),
          },
          {
            key: "todayProfit",
            label: "Bugünkü real qazanc",
            value: fmtMoney(d.todayProfit),
            sub: profitSub,
          },
        ]}
      />

      {/* ② DİQQƏT BÖLMƏSİ — "İndi nə etməliyəm?" (AC-5). Hər sətir mövcud
          səhifə/filtrə keçiddir, yeni məntiq YOXDUR. */}
      <Card title="İndi nə etməliyəm?">
        {attentionCount === 0 ? (
          <EmptyState
            embedded
            icon={Check}
            title="Diqqət tələb edən heç nə yoxdur"
            hint="Bütün əsas göstəricilər qaydasındadır."
          />
        ) : (
          <div className="-my-1 divide-y divide-stone-100">
            {d.lowStock.length > 0 && (
              <Link
                to="/mallar"
                search={{ status: "Azalır" }}
                className={attentionRowCls}
              >
                <AttentionContent
                  icon={AlertTriangle}
                  tone="amber"
                  title={`${d.lowStock.length} malın stoku azalır`}
                />
              </Link>
            )}

            {d.receivables > 0 && (
              <Link to="/borclar" search={{ status: "borclu" }} className={attentionRowCls}>
                <AttentionContent
                  icon={Users}
                  tone="amber"
                  title={`Sizə borclu olanlar: ${fmtMoney(d.receivables)}`}
                  sub={
                    debtsKpi
                      ? `${debtsKpi.debtorCount} müştəri borcludur`
                      : undefined
                  }
                />
              </Link>
            )}

            {d.payables > 0 && (
              <Link to="/tedarukculer" className={attentionRowCls}>
                <AttentionContent
                  icon={Truck}
                  tone="amber"
                  title={`Təchizatçılara borcunuz: ${fmtMoney(d.payables)}`}
                />
              </Link>
            )}

            {closingLoaded &&
              (todayClosing ? (
                <Link to="/gun-sonu" className={attentionRowCls}>
                  <AttentionContent
                    icon={Lock}
                    tone={closingDiff === 0 ? "green" : "amber"}
                    title="Gün bağlanıb"
                    sub={
                      closingDiff === 0
                        ? "Kassa düz gəlib"
                        : closingDiff > 0
                          ? `Yoxlanmalı fərq: ${fmtMoneySigned(closingDiff)}`
                          : `Kassada çatışmazlıq: ${fmtMoney(Math.abs(closingDiff))}`
                    }
                  />
                </Link>
              ) : (
                <Link to="/gun-sonu" className={attentionRowCls}>
                  <AttentionContent
                    icon={Clock}
                    tone="amber"
                    title="Bu gün hələ bağlanmayıb"
                    sub="Kassanı sayıb günü bağlayın"
                  />
                </Link>
              ))}

            {d.frozen.length > 0 && (
              <Link to="/mallar" className={attentionRowCls}>
                <AttentionContent
                  icon={Snowflake}
                  tone="indigo"
                  title={`${d.frozen.length} mal aylardır satılmır`}
                  sub={`${fmtMoney(totalFrozenValue)} dəyərində pul donub`}
                />
              </Link>
            )}
          </div>
        )}
      </Card>

      {/* ③ İKİNCİ DƏRƏCƏLİ DETALLAR — kiçik, sakit (AC-3). */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Ödəniş növü üzrə satış
          </p>
          <div className="grid grid-cols-3 divide-x divide-stone-200">
            {paymentSplit.map((item) => (
              <div
                key={item.key}
                className="min-w-0 px-2 text-center first:pl-0 last:pr-0"
              >
                <span className="block truncate text-[11px] text-stone-500">
                  {item.label}
                </span>
                <span className="block truncate text-sm font-bold tabular-nums text-stone-800">
                  {fmtMoney(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50/60 px-3 py-2.5">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
            Anbar və borc göstəriciləri
          </p>
          <div className="grid grid-cols-3 divide-x divide-stone-200">
            {stockAndDebts.map((item) => (
              <div
                key={item.key}
                className="min-w-0 px-2 text-center first:pl-0 last:pr-0"
              >
                <span className="block truncate text-[11px] text-stone-500">
                  {item.label}
                </span>
                <span className="block truncate text-sm font-bold tabular-nums text-stone-800">
                  {fmtMoney(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış (son 14 gün)">
          {hasDailyData ? (
            <DailyBarChart data={d.daily} />
          ) : (
            <ChartEmptyState icon={BarChart3} />
          )}
        </Card>
        <Card title="Aylıq qazanc (son 6 ay)">
          {hasMonthlyData ? (
            <TrendLineChart data={d.monthly} xKey="month" stroke="#b45309" />
          ) : (
            <ChartEmptyState icon={TrendingUp} />
          )}
        </Card>
      </div>

      {/* Mövcud alt bölmələr — toxunma minimum (FE#72). */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Ən çox satılan mallar"
          action={
            <Link
              to="/hesabatlar"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Hamısı <ChevronRight size={13} />
            </Link>
          }
        >
          <div className="space-y-2.5">
            {d.topProducts.slice(0, 5).map(({ product, qty }, i) => (
              <div key={product.id} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm text-stone-700">{product.name}</span>
                <span className="text-sm font-bold tabular-nums text-stone-900">{qty} əd.</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Son satışlar">
          {d.recentSales.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Hələ satış yoxdur"
              hint="Satış edildikcə sonuncular burada görünəcək."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {d.recentSales.map((s) => {
                const cus = d.recentSaleCustomer(s.id);
                return (
                <div key={s.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {s.productName}
                      {s.category ? (
                        <span className="ml-1.5 font-normal text-stone-400">
                          {s.category}
                        </span>
                      ) : null}
                      <span className="font-normal text-stone-500">
                        {" "}
                        × {s.quantity}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-stone-400">
                      {fmtDate(s.createdAt)}
                      {cus ? ` · ${cus}` : ""}
                    </p>
                  </div>
                  <Badge tone={s.paymentType}>{s.paymentType}</Badge>
                  <span className="w-24 text-right text-sm font-bold tabular-nums text-stone-900">
                    {fmtMoney(s.totalAmount)}
                  </span>
                </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Son ödənişlər (nisyə)">
          {d.recentPayments.length === 0 ? (
            <EmptyState
              icon={HandCoins}
              title="Hələ ödəniş yoxdur"
              hint="Müştərilər borc ödədikcə burada görünəcək."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {d.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {d.cusName(p.customerId)}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {fmtDate(p.date)} · {p.method}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-emerald-700">
                    +{fmtMoney(p.amount)}
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
