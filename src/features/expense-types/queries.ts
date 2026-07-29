import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseTypesApi } from "./api";

export const expenseTypeKeys = {
  all: ["expense-types"] as const,
};

export const useExpenseTypes = () =>
  useQuery({ queryKey: expenseTypeKeys.all, queryFn: expenseTypesApi.list });

export const useCreateExpenseType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => expenseTypesApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseTypeKeys.all });
    },
  });
};
