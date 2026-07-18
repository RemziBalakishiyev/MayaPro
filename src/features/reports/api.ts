/**
 * Reports/Dashboard API qatı.
 *
 * REAL rejimdə Dashboard TAM /api/reports/dashboard cavabından qurulur
 * (qrafiklər, son satış/ödəniş, donmuş mallar daxil) — xam kolleksiya ÇƏKİLMİR.
 * Yalnız ödəniş növü bölgüsü (nağd/kart/nisyə) üçün /api/reports/summary?today
 * əlavə çağırılır. getAll() isə YALNIZ Hesabatlar səhifəsi üçün xam kolleksiyaları
 * verir (dövr filtrləri client-də tətbiq olunur).
 *
 * MOCK rejimdə köhnə davranış: getAll() db-dən oxuyur, dashboard client-də
 * computeDashboardStats ilə hesablanır.
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
  /** Qazancı naməlum (sərbəst, mayasız) bugünkü satışların sayı. */
  unknownProfitSalesCount?: number;
  /** Həmin satışların ümumi satış məbləği. */
  unknownProfitAmount?: number;
  totalCustomerDebt: number;
  totalSupplierDebt: number;
  expectedCash: number;
  frozenProducts: {
    days30: number;
    days60: number;
    days90: number;
    items: {
      id: string;
      name: string;
      quantity: number;
      frozenValue: number;
      /** Son satışdan keçən gün; heç satılmayıbsa null. */
      daysSinceLastSale: number | null;
    }[];
  };
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
  dailySeries: { date: string; sales: number; profit: number }[];
  monthlySeries: { month: string; profit: number }[];
  recentSales: {
    id: string;
    date: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    paymentType: string;
    /** Nisyə satışda müştəri adı; nağd/kartda null. */
    customerName?: string | null;
  }[];
  recentPayments: {
    id: string;
    date: string;
    customerName: string;
    amount: number;
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

/** Hesabatlar səhifəsi üçün xam kolleksiyalar. */
export interface DashboardData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  closings: Closing[];
  payments: CustomerPayment[];
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
  const profit = sumBy(ps, (s) => s.profit ?? 0);
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
  /** Server dashboard aggregatı (real). Mock rejimdə null. */
  getDashboard: (): Promise<DashboardDto | null> =>
    USE_MOCK
      ? Promise.resolve(null)
      : apiClient.get<DashboardDto>("/api/reports/dashboard"),

  getSummary: (period: Period): Promise<SummaryData> =>
    USE_MOCK
      ? mockSummary(period)
      : apiClient.get<SummaryData>(`/api/reports/summary?period=${period}`),

  /** Hesabatlar üçün xam kolleksiyalar (dashboard səhifəsi bunu ÇAĞIRMIR). */
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

    const [products, sales, customers, suppliers, expenses, employees, closings] =
      await Promise.all([
        productsApi.list(),
        salesApi.list(),
        customersApi.list(),
        suppliersApi.list(),
        expensesApi.list(),
        employeesApi.list(),
        closingsApi.list(),
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
    };
  },
};
