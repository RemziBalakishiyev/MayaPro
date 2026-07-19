import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi, type NewCustomer } from "./api";

export const customerKeys = {
  all: ["customers"] as const,
  payments: (id: string) => ["customers", id, "payments"] as const,
  history: (id: string) => ["customers", id, "history"] as const,
};

export const useCustomers = () =>
  useQuery({
    queryKey: customerKeys.all,
    queryFn: customersApi.list,
  });

export const useCustomerPayments = (customerId: string | undefined) =>
  useQuery({
    queryKey: customerKeys.payments(customerId ?? ""),
    queryFn: () => customersApi.listPayments(customerId as string),
    enabled: !!customerId,
  });

export const useCustomerHistory = (customerId: string | undefined) =>
  useQuery({
    queryKey: customerKeys.history(customerId ?? ""),
    queryFn: () => customersApi.listHistory(customerId as string),
    enabled: !!customerId,
  });

export const useCreateCustomer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewCustomer) => customersApi.create(input),
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: customerKeys.all });
      if (customer?.id) {
        qc.invalidateQueries({ queryKey: customerKeys.history(customer.id) });
      }
    },
  });
};

export const useAddCustomerPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      amount,
      note,
    }: {
      customerId: string;
      amount: number;
      note?: string;
    }) => customersApi.addPayment(customerId, amount, note),
    onSuccess: (_data, { customerId }) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: customerKeys.payments(customerId) });
      qc.invalidateQueries({ queryKey: customerKeys.history(customerId) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
