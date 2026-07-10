/**
 * Expenses API qatı — mock/real sərhədi.
 */
import { expenseHandlers, type NewExpense } from "@/mocks/handlers";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const expensesApi = {
  list: () => (USE_MOCK ? expenseHandlers.list() : notImplemented()),
  create: (input: NewExpense) =>
    USE_MOCK ? expenseHandlers.createExpense(input) : notImplemented(),
};

export type { NewExpense };
