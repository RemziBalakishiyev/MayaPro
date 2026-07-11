/** Dashboard və Hesabatlar üçün təmiz (pure) hesablamalar. */
import { productStatus } from "@/features/products/lib";
import { daysBetween, daysAgoISO, fmtDate, todayISO } from "@/lib/format";
import type { Sale, Product, Expense, ProductStatus } from "@/types";

/** Recharts pie/progress rəngləri (MVP ilə eyni). */
export const PIE_COLORS = [
  "#047857",
  "#b45309",
  "#0369a1",
  "#be123c",
  "#7c3aed",
  "#57534e",
];

export const sumBy = <T>(arr: T[], f: (x: T) => number): number =>
  arr.reduce((a, x) => a + f(x), 0);

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ProductWithStatus extends Product {
  status: ProductStatus;
  lastSaleDate: string | null;
}

export interface FrozenProduct extends ProductWithStatus {
  idleDays: number;
  frozenValue: number;
}

/** productId → sonuncu satış tarixi. */
export const lastSaleMap = (sales: Sale[]): Record<string, string> => {
  const m: Record<string, string> = {};
  sales.forEach((s) => {
    if (!m[s.productId] || s.createdAt > m[s.productId]) m[s.productId] = s.createdAt;
  });
  return m;
};

export const withStatus = (
  products: Product[],
  sales: Sale[],
): ProductWithStatus[] => {
  const last = lastSaleMap(sales);
  return products.map((p) => ({
    ...p,
    status: productStatus(p, last[p.id]),
    lastSaleDate: last[p.id] ?? null,
  }));
};

/** Azalan/bitən stok: quantity ≤ minStock. */
export const lowStockProducts = (products: Product[]): Product[] =>
  products.filter((p) => p.quantity <= p.minStock);

/** Dondurulmuş mallar: son satışından 30+ gün keçən və stokda olanlar. */
export const frozenProducts = (
  products: Product[],
  sales: Sale[],
): FrozenProduct[] => {
  const last = lastSaleMap(sales);
  return withStatus(products, sales)
    .map((p) => ({
      ...p,
      idleDays: daysBetween(last[p.id] ?? p.createdAt),
      frozenValue: p.realCostPerUnit * p.quantity,
    }))
    .filter((p) => p.idleDays >= 30 && p.quantity > 0);
};

export interface TopProduct {
  product: Product;
  qty: number;
}

/** Satış sayına görə mallar (çoxdan aza). */
export const topProductsByQty = (
  sales: Sale[],
  products: Product[],
): TopProduct[] => {
  const byId: Record<string, number> = {};
  sales.forEach((s) => {
    byId[s.productId] = (byId[s.productId] ?? 0) + s.quantity;
  });
  return Object.entries(byId)
    .map(([pid, qty]) => ({
      product: products.find((p) => p.id === pid),
      qty,
    }))
    .filter((x): x is TopProduct => !!x.product)
    .sort((a, b) => b.qty - a.qty);
};

export interface DailyPoint {
  date: string;
  satis: number;
  qazanc: number;
}

/** Günlük satış+qazanc seriyası (son N gün). */
export const dailySeries = (sales: Sale[], days = 14): DailyPoint[] => {
  const out: DailyPoint[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const iso = daysAgoISO(d);
    const ds = sales.filter((s) => s.createdAt.slice(0, 10) === iso);
    out.push({
      date: fmtDate(iso).slice(0, 5),
      satis: round2(sumBy(ds, (s) => s.totalAmount)),
      qazanc: round2(sumBy(ds, (s) => s.profit)),
    });
  }
  return out;
};

export interface WeekPoint {
  week: string;
  qazanc: number;
}

/** Həftəlik qazanc trendi (son N həftə). */
export const weeklySeries = (sales: Sale[], weeks = 6): WeekPoint[] => {
  const out: WeekPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const from = daysAgoISO((w + 1) * 7 - 1);
    const to = daysAgoISO(w * 7);
    const ws = sales.filter((s) => {
      const d = s.createdAt.slice(0, 10);
      return d >= from && d <= to;
    });
    out.push({ week: `H${weeks - w}`, qazanc: Math.round(sumBy(ws, (s) => s.profit)) });
  }
  return out;
};

export interface MonthPoint {
  month: string;
  qazanc: number;
}

/** Aylıq qazanc seriyası (son N ay). */
export const monthlySeries = (sales: Sale[], months = 6): MonthPoint[] => {
  const [yStr, mStr] = todayISO().split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  const list: { y: number; m: number }[] = [];
  for (let i = 0; i < months; i++) {
    list.push({ y, m });
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  list.reverse();
  return list.map(({ y, m }) => {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const ms = sales.filter((s) => s.createdAt.slice(0, 7) === ym);
    return {
      month: `${String(m).padStart(2, "0")}.${String(y).slice(2)}`,
      qazanc: Math.round(sumBy(ms, (s) => s.profit)),
    };
  });
};

export interface NamedValue {
  name: string;
  value: number;
}

/** Xərc kateqoriya bölgüsü. */
export const expenseByCategory = (expenses: Expense[]): NamedValue[] => {
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
  });
  return Object.entries(byCat).map(([name, value]) => ({ name, value }));
};

/** Ödəniş növü bölgüsü (Nağd/Kart/Nisyə). */
export const paymentBreakdown = (sales: Sale[]): NamedValue[] =>
  (["Nağd", "Kart", "Nisyə"] as const).map((pt) => ({
    name: pt,
    value: sumBy(
      sales.filter((s) => s.paymentType === pt),
      (s) => s.totalAmount,
    ),
  }));

/** Ziyana satılan mallar (satış qiyməti real mayadan aşağı). */
export const lossSellers = (products: Product[]): Product[] =>
  products.filter((p) => p.salePrice < p.realCostPerUnit);

export type Period = "today" | "week" | "month" | "all";

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Bu gün",
  week: "Bu həftə",
  month: "Bu ay",
  all: "Hamısı",
};

/** ISO tarix seçilmiş dövrə düşürmü. */
export const inPeriod = (iso: string, period: Period): boolean => {
  switch (period) {
    case "today":
      return iso.slice(0, 10) === todayISO();
    case "week":
      return daysBetween(iso) <= 6;
    case "month":
      return daysBetween(iso) <= 29;
    case "all":
    default:
      return true;
  }
};
