import { useQuery } from "@tanstack/react-query";
import { reportsApi, type DashboardData } from "./api";
import {
  sumBy,
  withStatus,
  lowStockProducts,
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
import { todayISO } from "@/lib/format";
import type { Sale, CustomerPayment } from "@/types";

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
}

export const computeDashboardStats = (data: DashboardData): DashboardStats => {
  const t = todayISO();
  const { products, sales, customers, suppliers, expenses, employees, closings, payments } =
    data;

  const todaySales = sales.filter((s) => s.createdAt === t);
  const paySum = (pt: string) =>
    sumBy(
      todaySales.filter((s) => s.paymentType === pt),
      (s) => s.totalAmount,
    );

  const todayCash = paySum("Nağd");
  const todayCard = paySum("Kart");
  const todayCredit = paySum("Nisyə");
  const todayTotal = sumBy(todaySales, (s) => s.totalAmount);
  const todayProfit = sumBy(todaySales, (s) => s.profit);
  const todayExpenses = sumBy(
    expenses.filter((e) => e.date === t),
    (e) => e.amount,
  );

  const stockValue = sumBy(products, (p) => p.realCostPerUnit * p.quantity);
  const receivables = sumBy(customers, (c) => c.remainingDebt);
  const payables = sumBy(suppliers, (s) => s.remainingDebt);

  // Açılış kassası = son bağlanışın faktiki məbləği (yoxdursa 0)
  const lastClosing = [...closings].sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const openingCash = lastClosing?.actualCash ?? 0;
  const expectedCash = openingCash + todayCash - todayExpenses;

  const statusList = withStatus(products, sales);
  const lowStock = statusList.filter((p) => p.quantity <= p.minStock);

  const empMap = new Map(employees.map((e) => [e.id, e.name]));
  const cusMap = new Map(customers.map((c) => [c.id, c.name]));

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
    topProducts: topProductsByQty(sales, products),
    lowStock,
    frozen: frozenProducts(products, sales),
    recentSales: [...sales].reverse().slice(0, 5),
    recentPayments: [...payments]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5),
    daily: dailySeries(sales, 14),
    monthly: monthlySeries(sales, 6),
    expByCat: expenseByCategory(expenses),
    empName: (id) => empMap.get(id) ?? "—",
    cusName: (id) => cusMap.get(id) ?? "—",
  };
};

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.getAll,
    select: computeDashboardStats,
  });

/** Hesabatlar səhifəsi üçün xam data (dövr filtrini komponent tətbiq edir). */
export const useReportsData = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.getAll,
  });

/** lowStock sayı — sidebar badge üçün yüngül selektor. */
export const useLowStockCount = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.getAll,
    select: (d: DashboardData) => lowStockProducts(d.products).length,
  });
