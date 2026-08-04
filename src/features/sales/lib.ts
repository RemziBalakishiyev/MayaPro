/** Satış sətri üçün təmiz (pure) hesablamalar. */
import { fmtDate, roundMoney } from "@/lib/format";
import type { PaymentType, Sale } from "@/types";

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

export interface SalePaymentPlan {
  /** Faktiki ödənilən məbləğ (0 ≤ paidAmount ≤ total). */
  paidAmount: number;
  /** total − paidAmount (0-dan aşağı düşmür). */
  remaining: number;
  /** Yekun saxlanılan ödəniş növü — qalıq varsa həmişə "Nisyə". */
  paymentType: PaymentType;
  /** Ödənilən hissənin üsulu — yalnız qalıq varsa `paymentType`-dan fərqli məna daşıyır. */
  paidVia: PaymentType;
}

/**
 * BE#15 — qismən ödənişli satış qaydası: backend `SalePaymentPlan.Resolve`
 * ilə bir mənbə (mock rejimdə eyni davranışı təkrarlamaq üçün). Qalıq (
 * total − paidAmount) müsbətdirsə saxlanılan növ həmişə "Nisyə"-dir —
 * tələb olunan növdən asılı olmayaraq.
 */
export const resolveSalePaymentPlan = (
  requestedType: PaymentType,
  total: number,
  paidAmount?: number | null,
  paidVia?: PaymentType | null,
): SalePaymentPlan => {
  // Backend validatoru 0 ≤ paidAmount ≤ total qaydasını qoruyur; mock rejimdə
  // eyni invariantı burada təmin edirik (mənfi/artıq dəyər saxlanılmasın).
  const requested = paidAmount ?? (requestedType === "Nisyə" ? 0 : total);
  const effectivePaid = roundMoney(Math.min(Math.max(0, requested), total));
  const remaining = roundMoney(Math.max(0, total - effectivePaid));
  const receivedVia = paidVia && paidVia !== "Nisyə" ? paidVia : null;
  const paymentType: PaymentType =
    remaining > 0
      ? "Nisyə"
      : requestedType === "Nisyə"
        ? (receivedVia ?? "Nağd")
        : requestedType;
  // Qalıq yoxdursa pul yalnız saxlanılan növlə gəlmiş sayılır (backend qaydası).
  const resolvedVia: PaymentType =
    remaining > 0 ? (receivedVia ?? "Nağd") : paymentType;
  return {
    paidAmount: effectivePaid,
    remaining,
    paymentType,
    paidVia: resolvedVia,
  };
};

/** Nağd/Kart/Nisyə bölgüsü — faktiki alınan pul (BE#19 qaydası). */
export interface SalesMoneySplit {
  /** Nağd alınan pul (nisyə satışın nağd ilkin ödənişi də daxil). */
  cash: number;
  /** Kartla alınan pul (nisyə satışın kart ilkin ödənişi də daxil). */
  card: number;
  /** Nisyə = yalnız ödənilməmiş qalıq (satışın tam yekunu deyil). */
  credit: number;
}

/**
 * Satış siyahısının "real daxil olan pul" bölgüsü — backend
 * `SalesReportRowTotals.ComputeReceivedTotals` (BE#19) ilə eyni qayda:
 * nağd/kart səbətinə `paidVia` üzrə `paidAmount` düşür, nisyəyə isə yalnız
 * `remainingAmount`. Beləcə qismən ödənilmiş satışın nağd hissəsi gün sonu
 * medaxilində itmir və hesabat/dashboard rəqəmləri backend ilə üst-üstə düşür.
 */
export const salesMoneySplit = (sales: Sale[]): SalesMoneySplit => {
  let cash = 0;
  let card = 0;
  let credit = 0;
  for (const s of sales) {
    const paid = Number(s.paidAmount) || 0;
    if (s.paidVia === "Nağd") cash += paid;
    else if (s.paidVia === "Kart") card += paid;
    if (s.paymentType === "Nisyə") credit += Number(s.remainingAmount) || 0;
  }
  return { cash: roundMoney(cash), card: roundMoney(card), credit: roundMoney(credit) };
};

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
