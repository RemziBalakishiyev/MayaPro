import type { ProductExpenseLine, Product, ProductStatus } from "@/types";
import { daysBetween } from "@/lib/format";

/** Xüsusiyyət dəyərlərini axtarış üçün bir sətirdə birləşdirir. */
export const attrText = (p: Product): string =>
  (p.attributes ?? []).map((a) => a.value).join(" ");

/** Cədvəl/kart alt-sətri üçün ilk xüsusiyyət dəyəri (yoxdursa boş). */
export const firstAttrValue = (p: Product): string =>
  (p.attributes ?? [])[0]?.value ?? "";

/** Partiya xərclərinin cəmi (Σ amount). */
export const totalExpenses = (expenses: ProductExpenseLine[]): number =>
  (expenses ?? []).reduce((s, e) => s + (Number(e.amount) || 0), 0);

/**
 * Eyni adlı sətirləri cəmləyir (göndərmədən əvvəl).
 * Boş ad və sıfır/mənfi məbləğ atılır.
 */
export const mergeExpenseLines = (
  rows: ProductExpenseLine[],
): ProductExpenseLine[] => {
  const map = new Map<string, number>();
  for (const r of rows ?? []) {
    const name = (r.name ?? "").trim();
    if (!name) continue;
    const amount = Number(r.amount) || 0;
    if (amount <= 0) continue;
    map.set(name, (map.get(name) ?? 0) + amount);
  }
  return [...map.entries()].map(([name, amount]) => ({ name, amount }));
};

/** Real maya: (alış məbləği + bütün xərclər) / miqdar */
export const calcRealCost = (
  purchasePrice: number,
  qty: number,
  expenses: ProductExpenseLine[],
): number =>
  qty > 0 ? (Number(purchasePrice) * qty + totalExpenses(expenses)) / qty : 0;

/** 1 ədədin qazancı. */
export const profitPerUnit = (salePrice: number, realCost: number): number =>
  Number(salePrice) - Number(realCost);

/** Mənfəət faizi (real mayaya nisbətən). */
export const profitPercent = (salePrice: number, realCost: number): number =>
  realCost > 0 ? ((Number(salePrice) - realCost) / realCost) * 100 : 0;

/** Malın statusu biznes qaydalarına görə hesablanır (MVP ilə eyni). */
export const productStatus = (
  p: Product,
  lastSaleDate?: string | null,
): ProductStatus => {
  if (p.quantity <= 0) return "Bitib";
  if (p.salePrice < p.realCostPerUnit) return "Ziyana satılır";
  if (p.quantity <= p.minStock) return "Azalır";
  if (daysBetween(lastSaleDate || p.createdAt) >= 30) return "Satılmır";
  return "Stokda var";
};
