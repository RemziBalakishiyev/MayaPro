import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type ExpenseListParams, type NewExpense } from "./api";

export const expenseKeys = {
  all: ["expenses"] as const,
  /**
   * Filtrli siyahı — açar ["expenses", params] formasındadır ki, dövr
   * dəyişəndə yeni sorğu getsin. Prefiks dəyişmədiyi üçün mövcud
   * `invalidateQueries({ queryKey: ["expenses"] })` hamısını əhatə edir.
   */
  list: (params: ExpenseListParams = {}) => ["expenses", params] as const,
};

const invalidateExpenseSideEffects = (
  qc: ReturnType<typeof useQueryClient>,
) => {
  qc.invalidateQueries({ queryKey: ["expenses"] });
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["summary"] });
  qc.invalidateQueries({ queryKey: ["activity"] });
};

export const useExpenses = (params: ExpenseListParams = {}) =>
  useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: () => expensesApi.list(params),
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewExpense) => expensesApi.create(input),
    onSuccess: () => invalidateExpenseSideEffects(qc),
  });
};

export const useUpdateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NewExpense }) =>
      expensesApi.update(id, input),
    onSuccess: () => invalidateExpenseSideEffects(qc),
  });
};

export const useDeleteExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => invalidateExpenseSideEffects(qc),
  });
};
