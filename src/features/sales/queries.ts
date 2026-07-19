import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "./api";
import {
  createSaleSchema,
  type CreateSaleInput,
  type SalesListParams,
} from "./types";
import type { PaymentType } from "@/types";
import type { Period } from "@/features/reports/lib";
import { periodToRange } from "./lib";

/** Jurnal cədvəlində səhifə başına sətir. */
export const JOURNAL_PAGE_SIZE = 10;

export interface SalesJournalFilters {
  period: Period;
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
  const range = periodToRange(filters.period);
  const query = filters.q?.trim() || undefined;
  const params: SalesListParams = {
    ...range,
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
    onSuccess: () => {
      // Satış → stok azaldı, borc dəyişə bilər, dashboard/jurnal yeniləndi
      qc.invalidateQueries({ queryKey: saleKeys.all });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
