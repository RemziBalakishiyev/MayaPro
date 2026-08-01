/**
 * Expenses API qatı — mock/real sərhədi.
 */
import { expenseHandlers, type NewExpense } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Expense, ExpenseSource } from "@/types";

interface ExpenseDto {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  productId: string | null;
  productName: string | null;
  note: string | null;
  /** Backend sahəsi; köhnə cavablarda yoxdursa productId-dən çıxarılır. */
  source?: ExpenseSource;
  createdByUserId: string | null;
  createdAt: string;
}

const toExpense = (d: ExpenseDto): Expense => ({
  id: d.id,
  title: d.title,
  category: d.category,
  amount: d.amount,
  productId: d.productId ?? null,
  date: d.date,
  note: d.note ?? "",
  source: d.source ?? (d.productId ? "product" : "general"),
  createdByUserId: d.createdByUserId ?? null,
});

/**
 * Siyahı filtri — BE#22: `from`/`to` (ISO gün, hər iki sərhəd daxil) verilibsə
 * `month` tam nəzərə alınmır. Heç biri yoxdursa bütün xərclər qayıdır.
 */
export interface ExpenseListParams {
  from?: string;
  to?: string;
  month?: string;
}

const listQuery = ({ from, to, month }: ExpenseListParams): string => {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  // from/to backend-də month-u əvəzləyir → ikisini birlikdə göndərmirik.
  if (!from && !to && month) qs.set("month", month);
  const query = qs.toString();
  return query ? `?${query}` : "";
};

export const expensesApi = {
  /**
   * Mock rejimdə backend süzgəci yoxdur — bütün siyahı qaytarılır və dövr
   * filtri client-side (`inPeriod`) tətbiq olunur.
   */
  list: (params: ExpenseListParams = {}) =>
    USE_MOCK
      ? expenseHandlers.list()
      : apiClient
          .get<ExpenseDto[]>(`/api/expenses${listQuery(params)}`)
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
            source: input.source,
          })
          .then(toExpense),

  update: (id: string, input: NewExpense) =>
    USE_MOCK
      ? expenseHandlers.updateExpense(id, input)
      : apiClient
          .put<ExpenseDto>(`/api/expenses/${id}`, {
            title: input.title,
            category: input.category,
            amount: input.amount,
            date: input.date,
            productId: input.productId,
            note: input.note,
            source: input.source,
          })
          .then(toExpense),

  remove: (id: string) =>
    USE_MOCK
      ? expenseHandlers.deleteExpense(id)
      : apiClient.del<void>(`/api/expenses/${id}`),
};

export type { NewExpense };
