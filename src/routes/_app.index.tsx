import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  TrendingUp,
  Receipt,
  Wallet,
  CreditCard,
  HandCoins,
  Package,
  Users,
  Truck,
  Banknote,
  AlertTriangle,
  Snowflake,
  Check,
  ChevronRight,
} from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useDashboardStats } from "@/features/reports/queries";
import { SignatureBand } from "@/features/reports/components/SignatureBand";
import { DailyBarChart } from "@/features/reports/components/DailyBarChart";
import { TrendLineChart } from "@/features/reports/components/TrendLineChart";

export const Route = createFileRoute("/_app/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: d, isLoading } = useDashboardStats();

  if (isLoading || !d) {
    return (
      <div>
        <PageHead title="Dashboard" subtitle="Bugünkü vəziyyət bir baxışda" />
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHead title="Dashboard" subtitle="Bugünkü vəziyyət bir baxışda" />

      <SignatureBand
        expectedCash={d.expectedCash}
        openingCash={d.openingCash}
        todayCash={d.todayCash}
        todayExpenses={d.todayExpenses}
        paperProfit={d.paperProfit}
        todayCredit={d.todayCredit}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Bugünkü satış" value={fmtMoney(d.todayTotal)} icon={ShoppingCart} />
        <StatCard
          label="Bugünkü qazanc"
          value={fmtMoney(d.todayProfit)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard label="Bugünkü xərc" value={fmtMoney(d.todayExpenses)} icon={Receipt} tone="red" />
        <StatCard label="Nağd satış" value={fmtMoney(d.todayCash)} icon={Wallet} />
        <StatCard label="Kart satış" value={fmtMoney(d.todayCard)} icon={CreditCard} tone="indigo" />
        <StatCard label="Nisyə satış" value={fmtMoney(d.todayCredit)} icon={HandCoins} tone="amber" />
        <StatCard label="Anbar dəyəri" value={fmtMoney(d.stockValue)} sub="real maya ilə" icon={Package} />
        <StatCard label="Mənə borclular" value={fmtMoney(d.receivables)} icon={Users} tone="green" />
        <StatCard label="Mənim borclarım" value={fmtMoney(d.payables)} icon={Truck} tone="red" />
        <StatCard label="Kassada olmalı" value={fmtMoney(d.expectedCash)} icon={Banknote} tone="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış (son 14 gün)">
          <DailyBarChart data={d.daily} />
        </Card>
        <Card title="Aylıq qazanc (son 6 ay)">
          <TrendLineChart data={d.monthly} xKey="month" stroke="#b45309" />
        </Card>
      </div>

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

        <Card
          title={`Azalan stok (${d.lowStock.length})`}
          action={
            <Link
              to="/mallar"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Mallara keç <ChevronRight size={13} />
            </Link>
          }
        >
          {d.lowStock.length === 0 ? (
            <EmptyState icon={Check} title="Stok problemi yoxdur" hint="Bütün mallar minimum stokdan yuxarıdır." />
          ) : (
            <div className="space-y-2.5">
              {d.lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <AlertTriangle size={15} className={p.status === "Bitib" ? "text-red-500" : "text-amber-500"} />
                  <span className="flex-1 truncate text-sm text-stone-700">{p.name}</span>
                  <Badge tone={p.status}>{p.quantity} əd.</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Satılmayan mallar (pul dondurur)">
          {d.frozen.length === 0 ? (
            <EmptyState icon={Snowflake} title="Donmuş mal yoxdur" />
          ) : (
            <div className="space-y-2.5">
              {d.frozen.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <Snowflake size={15} className="text-sky-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-700">{p.name}</p>
                    <p className="text-[11px] text-stone-400">
                      {p.neverSold
                        ? "Heç satılmayıb"
                        : `${p.idleDays >= 90 ? "90+" : p.idleDays >= 60 ? "60+" : "30+"} gündür satılmır`}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-sky-700">
                    {fmtMoney(p.frozenValue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Son satışlar">
          {d.recentSales.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Satış yoxdur" />
          ) : (
            <div className="divide-y divide-stone-100">
              {d.recentSales.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {s.productName} × {s.quantity}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {fmtDate(s.createdAt)} · {d.empName(s.employeeId)}
                    </p>
                  </div>
                  <Badge tone={s.paymentType}>{s.paymentType}</Badge>
                  <span className="w-24 text-right text-sm font-bold tabular-nums text-stone-900">
                    {fmtMoney(s.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Son ödənişlər (nisyə)">
          {d.recentPayments.length === 0 ? (
            <EmptyState icon={HandCoins} title="Ödəniş yoxdur" />
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
