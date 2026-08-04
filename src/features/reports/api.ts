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
import { expenseBySource } from "@/features/expenses/lib";
import { salesMoneySplit } from "@/features/sales/lib";
import { employeesApi } from "@/features/employees/api";
import { closingsApi } from "@/features/day-end/api";
import { isoInRange, type PeriodRange } from "@/components/ui/period-filter-lib";
import { daysBetween, roundMoney } from "@/lib/format";
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
  PaymentType,
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
    /** Kateqoriya snapshot (varsa). */
    category?: string | null;
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
  /**
   * Xərc mənbəyi bölgüsü (Ümumi / Mala bağlı). `generalExpenses + productExpenses`
   * həmişə `expenses`-ə bərabərdir (backend invariantı, BE#6). OPTIONAL — köhnə
   * backend bu sahələri qaytarmaya bilər, çağıran tərəf lokal hesablamaya
   * (`expenseBySource`) fallback etməlidir (FE#9, AC3).
   */
  generalExpenses?: number;
  productExpenses?: number;
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
  // BE#19 — nağd/kart faktiki alınan puldur (qismən ödənişin ilkin hissəsi
  // daxil), nisyə isə yalnız ödənilməmiş qalıqdır.
  const split = salesMoneySplit(ps);
  const salesTotal = sumBy(ps, (s) => s.totalAmount);
  const profit = sumBy(ps, (s) => s.profit ?? 0);
  // Mənbə bölgüsü — real backend summary ilə eyni sahələr (BE#6 kontraktı),
  // Hesabatlar səhifəsi bunları lokal hesablama əvəzinə istifadə edə bilsin.
  // Ümumi xərc elə bölgünün cəmidir (backend-dəki kimi struktur invariant:
  // generalExpenses + productExpenses === expenses).
  const expBySource = expenseBySource(pe);
  const exp = expBySource.general + expBySource.product;
  return {
    period,
    from: null,
    to: null,
    salesTotal,
    profit,
    expenses: exp,
    salesCount: ps.length,
    netProfit: profit - exp,
    cashSales: split.cash,
    cardSales: split.card,
    creditSales: split.credit,
    generalExpenses: expBySource.general,
    productExpenses: expBySource.product,
  };
}

/** BE#27 — GET /api/reports/products-kpi. Mallar səhifəsinin başlıq altı kartları. */
export interface ProductsKpi {
  productCount: number;
  totalStockUnits: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  lowStockCount: number;
  /** Dövr ərzində satılan say (yalnız bu sahə + purchasedUnits period-scoped-dur). */
  soldUnits: number;
  purchasedUnits: number;
}

export interface PaymentTypeKpi {
  type: PaymentType;
  revenue: number;
  profit: number;
}

/** BE#27 — GET /api/reports/sales-kpi. Satış jurnalı üstündəki KPI sırası. */
export interface SalesKpi {
  salesCount: number;
  totalRevenue: number;
  totalProfit: number;
  unknownProfitSalesCount: number;
  unknownProfitAmount: number;
  byPayment: PaymentTypeKpi[];
  avgSale: number;
}

export interface TopDebtor {
  name: string;
  amount: number;
}

/** BE#27 — GET /api/reports/debts-kpi. Nisyə Borclar səhifəsinin KPI sırası. */
export interface DebtsKpi {
  totalOutstanding: number;
  debtorCount: number;
  topDebtor: TopDebtor | null;
  periodNewDebt: number;
  periodCollected: number;
  oldestDebtDays: number | null;
}

const kpiQuery = (range: PeriodRange): string => {
  const q = new URLSearchParams();
  if (range.from) q.set("from", range.from);
  if (range.to) q.set("to", range.to);
  const s = q.toString();
  return s ? `?${s}` : "";
};

/**
 * MOCK: products-kpi. `purchasedUnits` üçün mock DB-də anbar giriş
 * tarixçəsi saxlanılmır — dövr ərzində yaradılmış məhsulların ilkin sayı ilə
 * təxmini yaxınlaşma edilir (real backend BE#27 dəqiq stok hərəkətindən hesablayır).
 */
async function mockProductsKpi(range: PeriodRange): Promise<ProductsKpi> {
  const [products, sales] = await Promise.all([
    db.products.list(),
    db.sales.list(),
  ]);
  const periodSales = sales.filter((s) =>
    isoInRange(s.createdAt, range.from, range.to),
  );
  const periodNewProducts = products.filter((p) =>
    isoInRange(p.createdAt, range.from, range.to),
  );
  return {
    productCount: products.length,
    totalStockUnits: sumBy(products, (p) => p.quantity),
    totalCostValue: roundMoney(sumBy(products, (p) => p.realCostPerUnit * p.quantity)),
    totalSaleValue: roundMoney(sumBy(products, (p) => p.salePrice * p.quantity)),
    potentialProfit: roundMoney(
      sumBy(products, (p) => (p.salePrice - p.realCostPerUnit) * p.quantity),
    ),
    lowStockCount: products.filter((p) => p.quantity <= p.minStock).length,
    soldUnits: sumBy(periodSales, (s) => s.quantity),
    purchasedUnits: sumBy(periodNewProducts, (p) => p.initialQuantity),
  };
}

/** MOCK: sales-kpi — Satış Jurnalı ilə eyni qayda (BE#19 nağd/kart/nisyə bölgüsü). */
async function mockSalesKpi(range: PeriodRange): Promise<SalesKpi> {
  const sales = await db.sales.list();
  const ps = sales.filter((s) => isoInRange(s.createdAt, range.from, range.to));
  const known = ps.filter((s) => s.profit != null);
  const unknown = ps.filter((s) => s.profit == null);
  const split = salesMoneySplit(ps);
  const profitByType = (t: PaymentType): number =>
    roundMoney(
      sumBy(
        ps.filter((s) => s.paymentType === t && s.profit != null),
        (s) => s.profit ?? 0,
      ),
    );
  const byPayment: PaymentTypeKpi[] = [
    { type: "Nağd", revenue: split.cash, profit: profitByType("Nağd") },
    { type: "Kart", revenue: split.card, profit: profitByType("Kart") },
    { type: "Nisyə", revenue: split.credit, profit: profitByType("Nisyə") },
  ];
  return {
    salesCount: ps.length,
    totalRevenue: roundMoney(sumBy(ps, (s) => s.totalAmount)),
    totalProfit: roundMoney(sumBy(known, (s) => s.profit ?? 0)),
    unknownProfitSalesCount: unknown.length,
    unknownProfitAmount: roundMoney(sumBy(unknown, (s) => s.totalAmount)),
    byPayment,
    avgSale: ps.length > 0 ? roundMoney(sumBy(ps, (s) => s.totalAmount) / ps.length) : 0,
  };
}

/** MOCK: debts-kpi — snapshot sahələr (qalıq/borclu sayı/ən böyük borclu) həmişə "hazırda". */
async function mockDebtsKpi(range: PeriodRange): Promise<DebtsKpi> {
  const [customers, sales, payments] = await Promise.all([
    db.customers.list(),
    db.sales.list(),
    db.payments.list(),
  ]);
  const debtors = customers.filter((c) => c.remainingDebt > 0);
  const top = [...debtors].sort((a, b) => b.remainingDebt - a.remainingDebt)[0];
  const openSales = sales.filter((s) => s.remainingAmount > 0);
  const oldest = [...openSales].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )[0];
  return {
    totalOutstanding: roundMoney(sumBy(customers, (c) => c.remainingDebt)),
    debtorCount: debtors.length,
    topDebtor: top ? { name: top.name, amount: top.remainingDebt } : null,
    periodNewDebt: roundMoney(
      sumBy(
        sales.filter((s) => isoInRange(s.createdAt, range.from, range.to)),
        (s) => s.remainingAmount,
      ),
    ),
    periodCollected: roundMoney(
      sumBy(
        payments.filter((p) => isoInRange(p.date, range.from, range.to)),
        (p) => p.amount,
      ),
    ),
    oldestDebtDays: oldest ? daysBetween(oldest.createdAt) : null,
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

  /** FE#56 — Mallar səhifəsi başlıq altı KPI kartları. */
  getProductsKpi: (range: PeriodRange): Promise<ProductsKpi> =>
    USE_MOCK
      ? mockProductsKpi(range)
      : apiClient.get<ProductsKpi>(`/api/reports/products-kpi${kpiQuery(range)}`),

  /** FE#56 — Satış jurnalı üstü KPI sırası (jurnal ilə eyni dövrü paylaşır). */
  getSalesKpi: (range: PeriodRange): Promise<SalesKpi> =>
    USE_MOCK
      ? mockSalesKpi(range)
      : apiClient.get<SalesKpi>(`/api/reports/sales-kpi${kpiQuery(range)}`),

  /** FE#56 — Nisyə Borclar səhifəsi KPI sırası. */
  getDebtsKpi: (range: PeriodRange): Promise<DebtsKpi> =>
    USE_MOCK
      ? mockDebtsKpi(range)
      : apiClient.get<DebtsKpi>(`/api/reports/debts-kpi${kpiQuery(range)}`),

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

    const [products, salesPage, customers, suppliers, expenses, employees, closings] =
      await Promise.all([
        productsApi.list(),
        salesApi.list({ take: 10000, skip: 0 }),
        customersApi.list(),
        suppliersApi.list(),
        expensesApi.list(),
        employeesApi.list(),
        closingsApi.list(),
      ]);
    return {
      products,
      sales: salesPage.items,
      customers,
      suppliers,
      expenses,
      employees,
      closings,
      payments: [], // qlobal ödənişlər endpoint-i yoxdur
    };
  },
};
