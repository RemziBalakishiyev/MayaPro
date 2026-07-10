import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi, type NewExpense } from "./api";

export const expenseKeys = {
  all: ["expenses"] as const,
};

export const useExpenses = () =>
  useQuery({
    queryKey: expenseKeys.all,
    queryFn: expensesApi.list,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewExpense) => expensesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["products"] }); // maya dəyişə bilər
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
