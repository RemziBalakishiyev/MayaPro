import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { salesApi } from "./api";
import {
  createSaleSchema,
  type CreateSaleInput,
  type SalesListParams,
} from "./types";
import { todayISO } from "@/lib/format";
import type { PaymentType } from "@/types";
import type { Period } from "@/features/reports/lib";
import { periodToRange } from "./lib";

export const PAGE_SIZE = 50;

export const saleKeys = {
  all: ["sales"] as const,
  list: (p: SalesListParams) => ["sales", "list", p] as const,
  journal: (period: Period, pay?: PaymentType) =>
    ["sales", "journal", period, pay ?? ""] as const,
  today: (d: string) => ["sales", "today", d] as const,
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

/** Yalnız bugünkü satışlar (ən yenisi əvvəldə). */
export const useTodaySales = () => {
  const t = todayISO();
  return useQuery({
    queryKey: saleKeys.today(t),
    queryFn: async () => {
      const page = await salesApi.list({
        from: t,
        to: t,
        take: 500,
        skip: 0,
      });
      return page.items;
    },
  });
};

/** Satış jurnalı — server pagination + "Daha çox yüklə". */
export const useSalesJournal = (period: Period, paymentType?: PaymentType) => {
  const range = periodToRange(period);
  const base: SalesListParams = {
    ...range,
    paymentType,
    take: PAGE_SIZE,
  };

  return useInfiniteQuery({
    queryKey: saleKeys.journal(period, paymentType),
    queryFn: ({ pageParam }) =>
      salesApi.list({ ...base, skip: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const loaded = pages.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.totalCount ? loaded : undefined;
    },
  });
};

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
