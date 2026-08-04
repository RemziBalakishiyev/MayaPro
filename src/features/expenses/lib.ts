/**
 * Xərc domeninin xalis funksiyaları.
 *
 * Xərc növləri siyahısı `features/expense-types`-ə köçürüldü (useExpenseTypes) —
 * burada yalnız mənbə bölgüsü kimi hesablamalar qalır.
 *
 * FE#56 — dövr → from/to çevrilməsi artıq paylaşılan `PeriodFilter`
 * (`components/ui/period-filter-lib`) üzərindən gəlir; bu faylda ayrıca
 * dövr-aralıq funksiyası saxlanmır.
 */
import { fmtMoney } from "@/lib/format";
import type { Expense, Product } from "@/types";

/**
 * Mala bağlı xərcin 1 ədədin mayasına təsiri — backend
 * `Product.CalculateRealCost` qaydası ilə eyni məxrəc: xərc CARİ qalıq deyil,
 * partiyanın İLKİN sayına bölünür (`initialQuantity`).
 * Mal tapılmayanda və ya ilkin say 0/mənfi olanda `null` — UI-da sətir
 * ümumiyyətlə göstərilmir (NaN/Infinity ekrana çıxmasın).
 */
export const expenseCostImpactPerUnit = (
  amount: number,
  product: Pick<Product, "initialQuantity"> | null | undefined,
): number | null => {
  const qty = Number(product?.initialQuantity) || 0;
  if (qty <= 0) return null;
  const impact = (Number(amount) || 0) / qty;
  return Number.isFinite(impact) ? Math.round(impact * 100) / 100 : null;
};

/** Xərc mənbəyi bölgüsü — Ümumi (satışa bağlı olmayan) / Mala bağlı cəmləri. */
export interface ExpenseSourceTotals {
  general: number;
  product: number;
}

/** Mənbəyi olmayan köhnə qeydlər "general" sayılır (API mapping ilə eyni qayda). */
export const expenseBySource = (expenses: Expense[]): ExpenseSourceTotals =>
  expenses.reduce<ExpenseSourceTotals>(
    (acc, e) => {
      if (e.source === "product") acc.product += e.amount;
      else acc.general += e.amount;
      return acc;
    },
    { general: 0, product: 0 },
  );

/**
 * Xülasə mətni — Xərclər və Hesabatlar səhifələri EYNİ mətni göstərsin deyə
 * tək mənbədən qurulur.
 */
export const expenseSourceSummaryText = (totals: ExpenseSourceTotals): string =>
  `Satışdan əlavə xərclər: ${fmtMoney(totals.general)} · Mala bağlı: ${fmtMoney(totals.product)}`;
