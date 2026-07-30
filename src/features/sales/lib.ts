/** Satış sətri üçün təmiz (pure) hesablamalar. */
import { daysAgoISO, fmtDate, todayISO } from "@/lib/format";
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
 * Satış № — qaimə PDF-indəki nömrə ilə eyni format (backend
 * `ExportSaleInvoicePdfHandler.BuildInvoiceNumber`): "SF-yyyyMMdd-XXXXXX"
 * (satış tarixi + id-nin ilk 6 hex simvolu, böyük hərflə).
 * Tarix hissəsi `fmtDate` ilə formatlanır — layihədəki yeganə tarix helper-i.
 */
export const saleInvoiceNumber = (
  sale: Pick<Sale, "id" | "createdAt">,
): string => {
  const hex = sale.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `SF-${fmtDate(sale.createdAt, "yyyyMMdd")}-${hex}`;
};

/**
 * Satış tarixi + saatı: "10.07.2026 14:35". Backend yalnız gün qaytarıbsa
 * ("2026-07-10") saat hissəsi əlavə edilmir (00:00 uydurmaq yanlış olardı).
 * Jurnal cədvəli və detal drawer üçün tək mənbə.
 */
export const saleDateTime = (iso: string): string => {
  const date = fmtDate(iso, "dd.MM.yyyy");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return date;
  return `${date} ${fmtDate(iso, "HH:mm")}`;
};

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
