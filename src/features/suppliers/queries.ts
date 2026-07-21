import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliersApi, type NewSupplier } from "./api";

export const supplierKeys = {
  all: ["suppliers"] as const,
  payments: (id: string) => ["suppliers", id, "payments"] as const,
};

export const useSuppliers = () =>
  useQuery({
    queryKey: supplierKeys.all,
    queryFn: suppliersApi.list,
  });

export const useSupplierPayments = (supplierId: string | undefined) =>
  useQuery({
    queryKey: supplierKeys.payments(supplierId ?? ""),
    queryFn: () => suppliersApi.listPayments(supplierId as string),
    enabled: !!supplierId,
  });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewSupplier) => suppliersApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useUpdateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NewSupplier }) =>
      suppliersApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useDeleteSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useAddSupplierDebt = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, amount }: { supplierId: string; amount: number }) =>
      suppliersApi.addDebt(supplierId, amount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useAddSupplierPayment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, amount }: { supplierId: string; amount: number }) =>
      suppliersApi.addPayment(supplierId, amount),
    onSuccess: (_data, { supplierId }) => {
      qc.invalidateQueries({ queryKey: supplierKeys.all });
      qc.invalidateQueries({ queryKey: supplierKeys.payments(supplierId) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
