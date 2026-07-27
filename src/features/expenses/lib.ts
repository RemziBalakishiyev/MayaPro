/**
 * Xərc domeninin xalis funksiyaları.
 *
 * Xərc növləri siyahısı `features/expense-types`-ə köçürüldü (useExpenseTypes) —
 * burada yalnız mənbə bölgüsü kimi hesablamalar qalır.
 */
import { fmtMoney } from "@/lib/format";
import type { Expense } from "@/types";

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
