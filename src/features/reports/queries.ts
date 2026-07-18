import { useQuery } from "@tanstack/react-query";
import {
  reportsApi,
  type DashboardData,
  type DashboardDto,
  type SummaryData,
} from "./api";
import type { Period } from "./lib";
import {
  sumBy,
  withStatus,
  frozenProducts,
  topProductsByQty,
  dailySeries,
  monthlySeries,
  expenseByCategory,
  type ProductWithStatus,
  type FrozenProduct,
  type TopProduct,
  type DailyPoint,
  type MonthPoint,
  type NamedValue,
} from "./lib";
import { todayISO, fmtDate } from "@/lib/format";
import { USE_MOCK } from "@/lib/api-client";
import type { Sale, CustomerPayment, ProductStatus, PaymentType } from "@/types";

export interface DashboardStats {
  todayTotal: number;
  todayProfit: number;
  todayExpenses: number;
  todayCash: number;
  todayCard: number;
  todayCredit: number;
  stockValue: number;
  receivables: number;
  payables: number;
  openingCash: number;
  expectedCash: number;
  /** Kağız üzərində qazanc (bugünkü qazanc, nisyə daxil) */
  paperProfit: number;
  /** Bugünkü qazancı naməlum olan satışların sayı (sərbəst, mayasız). */
  unknownProfitSalesCount: number;
  /** Həmin satışların ümumi satış məbləği. */
  unknownProfitAmount: number;
  topProducts: TopProduct[];
  lowStock: ProductWithStatus[];
  frozen: FrozenProduct[];
  recentSales: Sale[];
  recentPayments: CustomerPayment[];
  daily: DailyPoint[];
  monthly: MonthPoint[];
  expByCat: NamedValue[];
  empName: (id: string) => string;
  cusName: (id: string) => string;
  /** Son satış üçün müştəri adı (nisyədə dolu, nağd/kartda null). */
  recentSaleCustomer: (saleId: string) => string | null;
}

/** MOCK: xam kolleksiyalardan client-side hesablama. */
export const computeDashboardStats = (data: DashboardData): DashboardStats => {
  const t = todayISO();
  const { products, sales, customers, suppliers, expenses, employees, closings, payments } =
    data;

  const todaySales = sales.filter((s) => s.createdAt.slice(0, 10) === t);
  const paySum = (pt: string) =>
    sumBy(
      todaySales.filter((s) => s.paymentType === pt),
      (s) => s.totalAmount,
    );

  const todayCash = paySum("Nağd");
  const todayCard = paySum("Kart");
  const todayCredit = paySum("Nisyə");
  const todayTotal = sumBy(todaySales, (s) => s.totalAmount);
  // Qazancı naməlum (null) satışlar 0 sayılır, ayrıca sayılır
  const todayProfit = sumBy(todaySales, (s) => s.profit ?? 0);
  const unknownProfitSales = todaySales.filter((s) => s.profit == null);
  const unknownProfitSalesCount = unknownProfitSales.length;
  const unknownProfitAmount = sumBy(unknownProfitSales, (s) => s.totalAmount);
  const todayExpenses = sumBy(
    expenses.filter((e) => e.date.slice(0, 10) === t),
    (e) => e.amount,
  );

  const stockValue = sumBy(products, (p) => p.realCostPerUnit * p.quantity);
  const receivables = sumBy(customers, (c) => c.remainingDebt);
  const payables = sumBy(suppliers, (s) => s.remainingDebt);

  const lastClosing = [...closings].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const openingCash = lastClosing?.actualCash ?? 0;
  const expectedCash = openingCash + todayCash - todayExpenses;

  const statusList = withStatus(products, sales);
  const lowStock = statusList.filter((p) => p.quantity <= p.minStock);

  const empMap = new Map(employees.map((e) => [e.id, e.name]));
  const cusMap = new Map(customers.map((c) => [c.id, c.name]));

  const recentSalesList = [...sales].reverse().slice(0, 5);
  // Son satışlarda müştəri adı: yalnız nisyə satışlarda (customerId dolu).
  const recentSaleCusMap = new Map(
    recentSalesList.map((s) => [
      s.id,
      s.paymentType === "Nisyə" && s.customerId
        ? (cusMap.get(s.customerId) ?? null)
        : null,
    ]),
  );

  return {
    todayTotal,
    todayProfit,
    todayExpenses,
    todayCash,
    todayCard,
    todayCredit,
    stockValue,
    receivables,
    payables,
    openingCash,
    expectedCash,
    paperProfit: todayProfit,
    unknownProfitSalesCount,
    unknownProfitAmount,
    topProducts: topProductsByQty(sales, products),
    lowStock,
    frozen: frozenProducts(products, sales),
    recentSales: recentSalesList,
    recentPayments: [...payments]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5),
    daily: dailySeries(sales, 14),
    monthly: monthlySeries(sales, 6),
    expByCat: expenseByCategory(expenses),
    empName: (id) => empMap.get(id) ?? "—",
    cusName: (id) => cusMap.get(id) ?? "—",
    recentSaleCustomer: (id) => recentSaleCusMap.get(id) ?? null,
  };
};

/** "2026-07" → "07.26" (mock monthlySeries ilə eyni format). */
const fmtMonth = (ym: string): string => {
  const [y, m] = ym.split("-");
  return `${m}.${y.slice(2)}`;
};

/**
 * REAL: DashboardStats-ı TAM server /reports/dashboard cavabından qurur
 * (+ ödəniş növü bölgüsü summary?today-dən). Xam kolleksiya istifadə OLUNMUR.
 * Komponentlərin gözlədiyi tiplər adapter sərhədində minimal obyektlərlə
 * doldurulur (yalnız UI-da istifadə olunan sahələr).
 */
export const assembleDashboardStats = (
  d: DashboardDto,
  sum: SummaryData,
): DashboardStats => {
  const openingCash = d.expectedCash - sum.cashSales + d.todayExpenses;

  const topProducts: TopProduct[] = d.topProducts.map((tp) => ({
    product: {
      id: tp.productId,
      name: tp.name,
    } as unknown as TopProduct["product"],
    qty: tp.quantitySold,
  }));

  const lowStock = d.lowStock.map(
    (ls) =>
      ({
        id: ls.productId,
        name: ls.name,
        quantity: ls.quantity,
        minStock: ls.minStock,
        status: (ls.quantity === 0 ? "Bitib" : "Azalır") as ProductStatus,
      }) as unknown as ProductWithStatus,
  );

  const frozen = d.frozenProducts.items.map(
    (it) =>
      ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        frozenValue: it.frozenValue,
        idleDays: it.daysSinceLastSale ?? 0,
        neverSold: it.daysSinceLastSale === null,
      }) as unknown as FrozenProduct,
  );

  const recentSales = d.recentSales.map(
    (rs) =>
      ({
        id: rs.id,
        productName: rs.productName,
        quantity: rs.quantity,
        totalAmount: rs.totalAmount,
        paymentType: rs.paymentType as PaymentType,
        createdAt: rs.date,
        employeeId: "",
      }) as unknown as Sale,
  );

  // Ödəniş adını birbaşa gətir: customerId olaraq ödəniş id-si, cusName xəritədən ad.
  const recentPayments = d.recentPayments.map(
    (rp) =>
      ({
        id: rp.id,
        customerId: rp.id,
        amount: rp.amount,
        date: rp.date,
        method: "Nağd",
      }) as CustomerPayment,
  );
  const cusMap = new Map(d.recentPayments.map((rp) => [rp.id, rp.customerName]));
  // Son satış → müştəri adı (serverdən; nağd/kartda null).
  const recentSaleCusMap = new Map(
    d.recentSales.map((rs) => [rs.id, rs.customerName ?? null]),
  );

  return {
    todayTotal: d.todaySales,
    todayProfit: d.todayProfit,
    todayExpenses: d.todayExpenses,
    todayCash: sum.cashSales,
    todayCard: sum.cardSales,
    todayCredit: sum.creditSales,
    stockValue: d.stockCostValue,
    receivables: d.totalCustomerDebt,
    payables: d.totalSupplierDebt,
    openingCash,
    expectedCash: d.expectedCash,
    paperProfit: d.todayProfit,
    unknownProfitSalesCount: d.unknownProfitSalesCount ?? 0,
    unknownProfitAmount: d.unknownProfitAmount ?? 0,
    topProducts,
    lowStock,
    frozen,
    recentSales,
    recentPayments,
    daily: d.dailySeries.map((x) => ({
      date: fmtDate(x.date).slice(0, 5),
      satis: x.sales,
      qazanc: x.profit,
    })),
    monthly: d.monthlySeries.map((x) => ({
      month: fmtMonth(x.month),
      qazanc: x.profit,
    })),
    expByCat: [], // dashboard səhifəsi istifadə etmir (ExpensePie Hesabatlardadır)
    empName: () => "—", // recentSales-də satıcı adı yoxdur
    cusName: (id) => cusMap.get(id) ?? "—",
    recentSaleCustomer: (id) => recentSaleCusMap.get(id) ?? null,
  };
};

/** Dashboard statistikası — REAL: yalnız /reports/dashboard + summary; MOCK: xam db. */
const getDashboardStats = async (): Promise<DashboardStats> => {
  if (USE_MOCK) return computeDashboardStats(await reportsApi.getAll());
  const [dash, sum] = await Promise.all([
    reportsApi.getDashboard(),
    reportsApi.getSummary("today"),
  ]);
  return assembleDashboardStats(dash as DashboardDto, sum);
};

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
  });

/** lowStock sayı — sidebar badge üçün yüngül selektor (eyni ["dashboard"] cache). */
export const useLowStockCount = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
    select: (s: DashboardStats) => s.lowStock.length,
  });

/**
 * Hesabatlar səhifəsi üçün xam data (dövr filtrini komponent tətbiq edir).
 * Ayrı cache açarı — dashboard səhifəsi bunu çağırmır. ["dashboard"] prefiksi
 * ilə invalidasiya bunu da əhatə edir.
 */
export const useReportsData = () =>
  useQuery({
    queryKey: ["dashboard", "raw"],
    queryFn: reportsApi.getAll,
  });

/** Dövr xülasəsi — server /api/reports/summary (gün sonu cəmləri də bundan gəlir). */
export const useSummary = (period: Period) =>
  useQuery({
    queryKey: ["summary", period],
    queryFn: () => reportsApi.getSummary(period),
  });
