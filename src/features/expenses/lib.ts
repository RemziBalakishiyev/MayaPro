import type { ExpenseCategory, ExpenseBreakdown } from "@/types";

/** Xərc kateqoriyaları — MVP-dəki EXP_CATS ilə eyni. */
export const EXP_CATS: ExpenseCategory[] = [
  "Yol",
  "Fəhlə",
  "Anbar/Yer",
  "Paket/Qutu",
  "Mağaza",
  "Digər",
];

/** Kateqoriya → malın xərc breakdown açarı (real maya hesablaması üçün). */
export const categoryToExpenseKey = (
  category: ExpenseCategory,
): keyof ExpenseBreakdown => {
  switch (category) {
    case "Yol":
      return "yol";
    case "Fəhlə":
      return "fehle";
    case "Anbar/Yer":
      return "yer";
    case "Paket/Qutu":
      return "paket";
    case "Mağaza":
    case "Digər":
    default:
      return "diger";
  }
};
