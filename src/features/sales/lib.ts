/** Satış sətri üçün təmiz (pure) hesablamalar. */
import { daysAgoISO, todayISO } from "@/lib/format";
import type { Period } from "@/features/reports/lib";
import type { Sale } from "@/types";

/** Period → API from/to (ISO tarix, gün səviyyəsi). */
export const periodToRange = (
  period: Period,
): { from?: string; to?: string } => {
  const to = todayISO();
  switch (period) {
    case "today":
      return { from: to, to };
    case "week":
      return { from: daysAgoISO(6), to };
    case "month":
      return { from: daysAgoISO(29), to };
    case "all":
    default:
      return {};
  }
};

/** Endirimdən əvvəlki cəm (vahid qiymət × say). */
export const lineTotal = (salePrice: number, qty: number): number =>
  (Number(salePrice) || 0) * (Number(qty) || 0);

/** Endirimdən sonrakı yekun (0-dan aşağı düşmür). */
export const netTotal = (
  salePrice: number,
  qty: number,
  discount: number,
): number => Math.max(0, lineTotal(salePrice, qty) - (Number(discount) || 0));

/** Bu satışdan qazanc: yekun − real maya × say. */
export const saleProfit = (
  salePrice: number,
  qty: number,
  discount: number,
  realCost: number,
): number => netTotal(salePrice, qty, discount) - (Number(realCost) || 0) * (Number(qty) || 0);

/** Vahid qiymət real mayadan aşağıdırsa (ziyanlı satış). */
export const isLossSale = (salePrice: number, realCost: number): boolean =>
  Number(salePrice) > 0 && realCost > 0 && Number(salePrice) < realCost;

/** Sərbəst satışda sənədləşmə xərc sətirlərinin cəmi (sətir yoxdursa 0). */
export const saleExpenseItemsTotal = (sale: Sale): number =>
  (sale.expenseItems ?? []).reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );

/**
 * "Xərc" — bu satışa düşən partiya/əlavə xərc (cədvəl və detal drawer üçün
 * tək mənbə):
 * - sərbəst (isManual) satışda: Σ expenseItems (xərc sətri yoxdursa 0 —
 *   "0" ilə "naməlum" fərqlidir);
 * - normal (katalog) satışda: (costPerUnit − purchasePricePerUnit) × say;
 * - snapshot-lardan biri yoxdursa (köhnə sətirlər): null → UI-da "—".
 */
export const saleBatchExpense = (sale: Sale): number | null => {
  if (sale.isManual) return saleExpenseItemsTotal(sale);
  const { costPerUnit, purchasePricePerUnit } = sale;
  // 0 keçərli dəyərdir → yalnız null/undefined "hesablanmır" sayılır
  if (costPerUnit == null || purchasePricePerUnit == null) return null;
  const qty = Number(sale.quantity) || 0;
  return (Number(costPerUnit) - Number(purchasePricePerUnit)) * qty;
};
