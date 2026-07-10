/** Gün sonu hesablamaları — təmiz (pure). */

/** Kassada olmalı məbləğ: açılış + nağd satış − nağd xərclər. */
export const expectedCash = (
  openingCash: number,
  cashSales: number,
  cashExpenses: number,
): number =>
  (Number(openingCash) || 0) +
  (Number(cashSales) || 0) -
  (Number(cashExpenses) || 0);

/** Fərq: faktiki sayım − gözlənilən. */
export const difference = (actual: number, expected: number): number =>
  (Number(actual) || 0) - (Number(expected) || 0);
