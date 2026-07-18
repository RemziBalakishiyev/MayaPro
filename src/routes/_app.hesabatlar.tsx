import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { TrendingDown, Snowflake, AlertTriangle, Check } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { useReportsData } from "@/features/reports/queries";
import {
  sumBy,
  inPeriod,
  dailySeries,
  weeklySeries,
  expenseByCategory,
  topProductsByQty,
  frozenProducts,
  lossSellers,
  paymentBreakdown,
  PERIOD_LABELS,
  type Period,
} from "@/features/reports/lib";
import { DailyBarChart } from "@/features/reports/components/DailyBarChart";
import { TrendLineChart } from "@/features/reports/components/TrendLineChart";
import { ExpensePie } from "@/features/reports/components/ExpensePie";
import { TopProductsBar } from "@/features/reports/components/TopProductsBar";
import { PaymentBreakdown } from "@/features/reports/components/PaymentBreakdown";

const PERIODS: Period[] = ["today", "week", "month", "all"];

const searchSchema = z.object({
  period: z.enum(["today", "week", "month", "all"]).default("month"),
});

export const Route = createFileRoute("/_app/hesabatlar")({
  validateSearch: searchSchema,
  component: HesabatlarPage,
});

function HesabatlarPage() {
  const navigate = Route.useNavigate();
  const { period } = Route.useSearch();
  const { data, isLoading } = useReportsData();

  const view = useMemo(() => {
    if (!data) return null;
    const { products, sales, expenses } = data;
    const periodSales = sales.filter((s) => inPeriod(s.createdAt, period));
    const periodExpenses = expenses.filter((e) => inPeriod(e.date, period));

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
      expenses: sumBy(periodExpenses, (e) => e.amount),
      stockValue: sumBy(products, (p) => p.realCostPerUnit * p.quantity),
      cashSales: sumBy(
        periodSales.filter((s) => s.paymentType === "Nağd"),
        (s) => s.totalAmount,
      ),
      creditSales: sumBy(
        periodSales.filter((s) => s.paymentType === "Nisyə"),
        (s) => s.totalAmount,
      ),
      daily: dailySeries(sales, 14),
      weekly: weeklySeries(sales, 6),
      expByCat: expenseByCategory(periodExpenses),
      topBar,
      payments: paymentBreakdown(periodSales),
      leastSold: [...topProductsByQty(periodSales, products)].reverse().slice(0, 5),
      frozen,
      frozenGroups,
      frozenTotal: sumBy(frozen, (p) => p.frozenValue),
      lossSellers: lossSellers(products),
    };
  }, [data, period]);

  if (isLoading || !view) {
    return (
      <div>
        <PageHead title="Hesabatlar" subtitle="Satış və qazanc analitikası" />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead
        title="Hesabatlar"
        subtitle="Satış, qazanc və xərc analitikası"
        actions={
          <div className="flex rounded-lg bg-stone-100 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => navigate({ search: { period: p } })}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors",
                  period === p
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-stone-500 hover:text-stone-700",
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Satış" value={fmtMoney(view.sales)} />
        <StatCard label="Xalis qazanc" value={fmtMoney(view.profit)} tone="green" />
        <StatCard label="Xərc" value={fmtMoney(view.expenses)} tone="red" />
        <StatCard label="Anbar dəyəri" value={fmtMoney(view.stockValue)} />
        <StatCard label="Nağd satış" value={fmtMoney(view.cashSales)} />
        <StatCard label="Nisyə satış" value={fmtMoney(view.creditSales)} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış + qazanc (son 14 gün)">
          <DailyBarChart data={view.daily} showProfit />
        </Card>
        <Card title="Həftəlik qazanc trendi">
          <TrendLineChart data={view.weekly} xKey="week" />
        </Card>
        <Card title="Xərc kateqoriyaları">
          <ExpensePie data={view.expByCat} />
        </Card>
        <Card title="Ən çox satılan mallar">
          <TopProductsBar data={view.topBar} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Nağd / Kart / Nisyə müqayisəsi (${PERIOD_LABELS[period]})`}>
          <PaymentBreakdown data={view.payments} />
        </Card>
        <Card title="Ən az satılan mallar">
          {view.leastSold.length === 0 ? (
            <EmptyState icon={TrendingDown} title="Satış datası yoxdur" />
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
            <EmptyState icon={Snowflake} title="Donmuş mal yoxdur" />
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
            <EmptyState icon={Check} title="Ziyana satılan mal yoxdur" />
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
