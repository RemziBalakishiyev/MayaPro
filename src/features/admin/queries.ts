import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, type NewTenantInput, type RecordPaymentInput } from "./api";

export const adminKeys = {
  tenants: ["admin", "tenants"] as const,
  payments: (id: string) => ["admin", "tenants", id, "payments"] as const,
  stats: ["admin", "stats"] as const,
};

/** Bütün siyahı çəkilir, axtarış/status filtri LOKAL aparılır (bax `api.ts` şərhi). */
export const useTenants = () =>
  useQuery({
    queryKey: adminKeys.tenants,
    queryFn: () => adminApi.listTenants(),
  });

export const useTenantPayments = (tenantId: string | undefined) =>
  useQuery({
    queryKey: adminKeys.payments(tenantId ?? ""),
    queryFn: () => adminApi.listPayments(tenantId as string),
    enabled: !!tenantId,
  });

export const usePlatformStats = () =>
  useQuery({
    queryKey: adminKeys.stats,
    queryFn: adminApi.getStats,
  });

function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.tenants });
    qc.invalidateQueries({ queryKey: adminKeys.stats });
  };
}

export const useCreateTenant = () => {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: NewTenantInput) => adminApi.createTenant(input),
    onSuccess: invalidate,
  });
};

export const useApproveTenant = () => {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, periodMonths }: { id: string; periodMonths: number }) =>
      adminApi.approveTenant(id, periodMonths),
    onSuccess: invalidate,
  });
};

export const useBlockTenant = () => {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => adminApi.blockTenant(id),
    onSuccess: invalidate,
  });
};

export const useUnblockTenant = () => {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id: string) => adminApi.unblockTenant(id),
    onSuccess: invalidate,
  });
};

export const useAddTenantPayment = () => {
  const qc = useQueryClient();
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RecordPaymentInput }) =>
      adminApi.addPayment(id, input),
    onSuccess: (_data, { id }) => {
      invalidate();
      qc.invalidateQueries({ queryKey: adminKeys.payments(id) });
    },
  });
};
