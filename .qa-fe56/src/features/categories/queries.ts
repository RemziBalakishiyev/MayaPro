import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi } from "./api";

export const categoryKeys = {
  all: ["categories"] as const,
};

export const useCategories = () =>
  useQuery({ queryKey: categoryKeys.all, queryFn: categoriesApi.list });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => categoriesApi.create(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
  });
};
