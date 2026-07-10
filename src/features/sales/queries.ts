import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi, type CreateSaleInput } from "./api";
import { todayISO } from "@/lib/format";
import type { Sale } from "@/types";

export const saleKeys = {
  all: ["sales"] as const,
};

export const useSales = () =>
  useQuery({
    queryKey: saleKeys.all,
    queryFn: salesApi.list,
  });

/** Yalnız bugünkü satışlar (ən yenisi əvvəldə). */
export const useTodaySales = () =>
  useQuery({
    queryKey: saleKeys.all,
    queryFn: salesApi.list,
    select: (sales: Sale[]) =>
      sales.filter((s) => s.createdAt === todayISO()).reverse(),
  });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) => salesApi.create(input),
    onSuccess: () => {
      // Satış → stok azaldı, borc dəyişə bilər, dashboard yeniləndi
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};
