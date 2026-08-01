/**
 * Xərc domeninin xalis funksiyaları.
 *
 * Xərc növləri siyahısı `features/expense-types`-ə köçürüldü (useExpenseTypes) —
 * burada yalnız mənbə bölgüsü kimi hesablamalar qalır.
 */
import { daysAgoISO, fmtMoney, todayISO } from "@/lib/format";
import type { Period } from "@/features/reports/lib";
import type { Expense, Product } from "@/types";

/**
 * Xərclər səhifəsinin dövr → API aralığı (from/to, hər iki sərhəd daxil).
 *
 * Satışdakı `periodToRange` ilə QƏSDƏN ayrıdır: orada "month" SON 30 GÜN
 * deməkdir, burada isə (Hesabatlar səhifəsi və `inPeriod` ilə eyni) TƏQVİM
 * ayıdır — ayın 1-i … bu gün. "year" isə ilin 1 yanvarı … bu gün.
 * Nəticə `inPeriod(date, period)` ilə eyni pəncərəni verir ki, real backend
 * (BE#22 `?from=&to=`) və mock (client-side süzgəc) eyni sətirləri göstərsin.
 */
export const expensePeriodToRange = (
  period: Period,
): { from?: string; to?: string } => {
  const to = todayISO();
  switch (period) {
    case "today":
      return { from: to, to };
    case "week":
      return { from: daysAgoISO(6), to };
    case "month":
      return { from: `${to.slice(0, 7)}-01`, to };
    case "year":
      return { from: `${to.slice(0, 4)}-01-01`, to };
    case "all":
    default:
      return {};
  }
};

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
