/**
 * Expenses API qatı — mock/real sərhədi.
 */
import { expenseHandlers, type NewExpense } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Expense, ExpenseCategory } from "@/types";

interface ExpenseDto {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  productId: string | null;
  productName: string | null;
  note: string | null;
  createdByUserId: string | null;
  createdAt: string;
}

const toExpense = (d: ExpenseDto): Expense => ({
  id: d.id,
  title: d.title,
  category: d.category as ExpenseCategory,
  amount: d.amount,
  productId: d.productId ?? null,
  date: d.date,
  note: d.note ?? "",
});

export const expensesApi = {
  list: (month?: string) =>
    USE_MOCK
      ? expenseHandlers.list()
      : apiClient
          .get<ExpenseDto[]>(`/api/expenses${month ? `?month=${month}` : ""}`)
          .then((rows) => rows.map(toExpense)),

  create: (input: NewExpense) =>
    USE_MOCK
      ? expenseHandlers.createExpense(input)
      : apiClient
          .post<ExpenseDto>("/api/expenses", {
            title: input.title,
            category: input.category,
            amount: input.amount,
            date: input.date,
            productId: input.productId,
            note: input.note,
          })
          .then(toExpense),
};

export type { NewExpense };
