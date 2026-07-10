import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi, type NewCustomer } from "./api";

export const customerKeys = {
  all: ["customers"] as const,
};

export const useCustomers = () =>
  useQuery({
    queryKey: customerKeys.all,
    queryFn: customersApi.list,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCustomer) => customersApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
  });
};
