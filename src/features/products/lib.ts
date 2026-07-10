import type { ExpenseBreakdown, Product, ProductStatus } from "@/types";
import { daysBetween } from "@/lib/format";

/** Partiya xərclərinin cəmi. */
export const totalExpenses = (e: ExpenseBreakdown): number =>
  (Number(e.yol) || 0) +
  (Number(e.fehle) || 0) +
  (Number(e.yer) || 0) +
  (Number(e.paket) || 0) +
  (Number(e.diger) || 0);

/** Real maya: (alış məbləği + bütün xərclər) / miqdar */
export const calcRealCost = (
  purchasePrice: number,
  qty: number,
  expenses: ExpenseBreakdown,
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
