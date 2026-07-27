/**
 * Xərc növləri API qatı — mock/real sərhədi.
 *
 * Backend: GET /api/expense-types → [{ id, name }], POST /api/expense-types { name }.
 * Mock: localStorage-dakı expenseTypes kolleksiyası.
 */
import { expenseTypeHandlers } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { ExpenseType } from "@/types";

export const expenseTypesApi = {
  list: (): Promise<ExpenseType[]> =>
    USE_MOCK
      ? expenseTypeHandlers.list()
      : apiClient.get<ExpenseType[]>("/api/expense-types"),

  create: (name: string): Promise<ExpenseType> =>
    USE_MOCK
      ? expenseTypeHandlers.create(name)
      : apiClient.post<ExpenseType>("/api/expense-types", { name: name.trim() }),
};
