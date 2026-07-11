/**
 * Reports/Dashboard API qatı.
 *
 * Server /api/reports/dashboard və /api/reports/summary AGGREGAT rəqəmləri verir
 * (bugünkü satış/qazanc/xərc, kassada olmalı, borclar, anbar dəyəri). Lakin qrafik
 * seriyaları, son satış/ödəniş siyahıları və donmuş mal detalları server DTO-sunda
 * YOXDUR — onlar üçün xam kolleksiyalar çəkilir və client-də hesablanır.
 * Beləliklə getAll() həm xam datanı, həm də server aggregatlarını qaytarır;
 * computeDashboardStats server rəqəmlərini əsas götürüb qalanını tamamlayır.
 *
 * Qeyd (uyğunsuzluq): qlobal ödənişlər endpoint-i yoxdur → dashboard-un "son
 * ödənişlər" bloku real rejimdə boş qalır (payments: []).
 */
import { db } from "@/mocks/db";
import { USE_MOCK, apiClient } from "@/lib/api-client";
import { productsApi } from "@/features/products/api";
import { salesApi } from "@/features/sales/api";
import { customersApi } from "@/features/customers/api";
import { suppliersApi } from "@/features/suppliers/api";
import { expensesApi } from "@/features/expenses/api";
import { employeesApi } from "@/features/employees/api";
import { closingsApi } from "@/features/day-end/api";
import { inPeriod, sumBy, type Period } from "./lib";
import type {
  Product,
  Sale,
  Customer,
  Supplier,
  Expense,
  Employee,
  Closing,
  CustomerPayment,
} from "@/types";

export interface DashboardDto {
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockCostValue: number;
  stockRetailValue: number;
  todaySales: number;
  todayProfit: number;
  todayExpenses: number;
  todaySalesCount: number;
  totalCustomerDebt: number;
  totalSupplierDebt: number;
  expectedCash: number;
  frozenProducts: { days30: number; days60: number; days90: number };
  topProducts: {
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  lowStock: {
    productId: string;
    name: string;
    quantity: number;
    minStock: number;
  }[];
}

export interface SummaryData {
  period: string;
  from: string | null;
  to: string | null;
  salesTotal: number;
  profit: number;
  expenses: number;
  salesCount: number;
  netProfit: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
}

export interface DashboardData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  closings: Closing[];
  payments: CustomerPayment[];
  /** Real rejimdə server aggregatları (mock rejimdə undefined). */
  dashboard?: DashboardDto;
  summaryToday?: SummaryData;
}

/** Mock rejim üçün dövr xülasəsi — db-dən hesablanır. */
async function mockSummary(period: Period): Promise<SummaryData> {
  const [sales, expenses] = await Promise.all([
    db.sales.list(),
    db.expenses.list(),
  ]);
  const ps = sales.filter((s) => inPeriod(s.createdAt, period));
  const pe = expenses.filter((e) => inPeriod(e.date, period));
  const byPt = (pt: string) =>
    sumBy(
      ps.filter((s) => s.paymentType === pt),
      (s) => s.totalAmount,
    );
  const salesTotal = sumBy(ps, (s) => s.totalAmount);
  const profit = sumBy(ps, (s) => s.profit);
  const exp = sumBy(pe, (e) => e.amount);
  return {
    period,
    from: null,
    to: null,
    salesTotal,
    profit,
    expenses: exp,
    salesCount: ps.length,
    netProfit: profit - exp,
    cashSales: byPt("Nağd"),
    cardSales: byPt("Kart"),
    creditSales: byPt("Nisyə"),
  };
}

export const reportsApi = {
  getSummary: (period: Period): Promise<SummaryData> =>
    USE_MOCK
      ? mockSummary(period)
      : apiClient.get<SummaryData>(`/api/reports/summary?period=${period}`),

  async getAll(): Promise<DashboardData> {
    if (USE_MOCK) {
      const [
        products,
        sales,
        customers,
        suppliers,
        expenses,
        employees,
        closings,
        payments,
      ] = await Promise.all([
        db.products.list(),
        db.sales.list(),
        db.customers.list(),
        db.suppliers.list(),
        db.expenses.list(),
        db.employees.list(),
        db.closings.list(),
        db.payments.list(),
      ]);
      return {
        products,
        sales,
        customers,
        suppliers,
        expenses,
        employees,
        closings,
        payments,
      };
    }

    const [
      products,
      sales,
      customers,
      suppliers,
      expenses,
      employees,
      closings,
      dashboard,
      summaryToday,
    ] = await Promise.all([
      productsApi.list(),
      salesApi.list(),
      customersApi.list(),
      suppliersApi.list(),
      expensesApi.list(),
      employeesApi.list(),
      closingsApi.list(),
      apiClient.get<DashboardDto>("/api/reports/dashboard"),
      reportsApi.getSummary("today"),
    ]);
    return {
      products,
      sales,
      customers,
      suppliers,
      expenses,
      employees,
      closings,
      payments: [], // qlobal ödənişlər endpoint-i yoxdur
      dashboard,
      summaryToday,
    };
  },
};
