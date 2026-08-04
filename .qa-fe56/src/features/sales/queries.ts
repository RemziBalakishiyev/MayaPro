import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "./api";
import {
  createSaleSchema,
  updateSaleSchema,
  type CreateSaleInput,
  type SalesListParams,
  type UpdateSaleInput,
} from "./types";
import type { PaymentType } from "@/types";

/** Jurnal cədvəlində səhifə başına sətir. */
export const JOURNAL_PAGE_SIZE = 10;

export interface SalesJournalFilters {
  /** FE#56 — paylaşılan PeriodFilter aralığı (əvvəlki `period` tab-ı əvəz edir). */
  from?: string;
  to?: string;
  paymentType?: PaymentType;
  q?: string;
  minProfit?: number;
  maxProfit?: number;
  minQty?: number;
  maxQty?: number;
}

export const saleKeys = {
  all: ["sales"] as const,
  list: (p: SalesListParams) => ["sales", "list", p] as const,
  journal: (f: SalesJournalFilters) => ["sales", "journal", f] as const,
  detail: (id: string) => ["sales", "detail", id] as const,
};

const invalidateSaleSideEffects = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: saleKeys.all });
  qc.invalidateQueries({ queryKey: ["products"] });
  qc.invalidateQueries({ queryKey: ["customers"] });
  qc.invalidateQueries({ queryKey: ["dashboard"] });
  qc.invalidateQueries({ queryKey: ["summary"] });
  qc.invalidateQueries({ queryKey: ["activity"] });
};

/** Tam siyahı (köhnə istehlakçılar: müştəri, mal detalları, tez satılanlar). */
export const useSales = () =>
  useQuery({
    queryKey: saleKeys.list({ take: 5000, skip: 0 }),
    queryFn: async () => {
      const page = await salesApi.list({ take: 5000, skip: 0 });
      return page.items;
    },
  });

/** Satış jurnalı — filterli siyahı (DataTable 10-luq pagination). */
export const useSalesJournal = (filters: SalesJournalFilters) => {
  const query = filters.q?.trim() || undefined;
  const params: SalesListParams = {
    from: filters.from,
    to: filters.to,
    paymentType: filters.paymentType,
    q: query,
    minProfit: filters.minProfit,
    maxProfit: filters.maxProfit,
    minQty: filters.minQty,
    maxQty: filters.maxQty,
    take: 5000,
    skip: 0,
  };

  return useQuery({
    queryKey: saleKeys.journal({ ...filters, q: query }),
    queryFn: async () => {
      const page = await salesApi.list(params);
      return page.items;
    },
  });
};

/** Tək satış detalı — drawer üçün (GET /api/sales/{id}). */
export const useSaleDetail = (id: string | null) =>
  useQuery({
    queryKey: saleKeys.detail(id ?? ""),
    queryFn: () => salesApi.get(id as string),
    enabled: !!id,
  });

export const useCreateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSaleInput) =>
      salesApi.create(createSaleSchema.parse(input)),
    onSuccess: () => invalidateSaleSideEffects(qc),
  });
};

export const useUpdateSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSaleInput }) =>
      salesApi.update(id, updateSaleSchema.parse(input)),
    onSuccess: () => invalidateSaleSideEffects(qc),
  });
};

export const useDeleteSale = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.remove(id),
    onSuccess: () => invalidateSaleSideEffects(qc),
  });
};
