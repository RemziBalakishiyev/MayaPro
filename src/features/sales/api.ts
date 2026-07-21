/**
 * Sales API qatı — mock/real sərhədi.
 */
import { saleHandlers } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { PagedResult } from "@/lib/paging";
import type {
  CreateSaleInput,
  SalesListParams,
  UpdateSaleInput,
} from "@/features/sales/types";
import type { Sale, SaleDetail, SaleExpenseItem } from "@/types";

export type { SalesListParams };

/** Backend SaleDto → frontend Sale (null sahələr normallaşdırılır). */
interface SaleDto extends Omit<Sale, "customerId" | "employeeId" | "isManual" | "expenseItems"> {
  customerId: string | null;
  employeeId: string | null;
  isManual?: boolean;
  soldByName?: string | null;
  expenseItems?: SaleExpenseItem[] | null;
}

interface SaleDetailDto extends SaleDto {
  customerName?: string | null;
  currentProductName?: string | null;
}

interface PagedSaleDto {
  items?: SaleDto[];
  Items?: SaleDto[];
  totalCount?: number;
  TotalCount?: number;
}

const toExpenseItems = (raw: SaleExpenseItem[] | null | undefined): SaleExpenseItem[] =>
  (raw ?? []).map((e) => ({
    name: e.name,
    amount: Number(e.amount) || 0,
  }));

const toSale = (d: SaleDto): Sale => ({
  ...d,
  customerId: d.customerId ?? null,
  employeeId: d.employeeId ?? "",
  isManual: d.isManual ?? false,
  soldByName: d.soldByName ?? null,
  category: d.category ?? null,
  expenseItems: toExpenseItems(d.expenseItems),
});

const toSaleDetail = (d: SaleDetailDto): SaleDetail => ({
  ...toSale(d),
  customerName: d.customerName ?? null,
  currentProductName: d.currentProductName ?? null,
});

const toPaged = (raw: PagedSaleDto | SaleDto[]): PagedResult<Sale> => {
  // Köhnə massiv cavabı (əgər backend hələ də massiv qaytarırsa)
  if (Array.isArray(raw)) {
    return { items: raw.map(toSale), totalCount: raw.length };
  }
  const items = (raw.items ?? raw.Items ?? []).map(toSale);
  const totalCount = raw.totalCount ?? raw.TotalCount ?? items.length;
  return { items, totalCount };
};

const buildQuery = (params: SalesListParams = {}): string => {
  const q = new URLSearchParams();
  if (params.take != null) q.set("take", String(params.take));
  if (params.skip != null) q.set("skip", String(params.skip));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.paymentType) q.set("paymentType", params.paymentType);
  if (params.q?.trim()) q.set("q", params.q.trim());
  if (params.minProfit != null) q.set("minProfit", String(params.minProfit));
  if (params.maxProfit != null) q.set("maxProfit", String(params.maxProfit));
  if (params.minQty != null) q.set("minQty", String(params.minQty));
  if (params.maxQty != null) q.set("maxQty", String(params.maxQty));
  const s = q.toString();
  return s ? `?${s}` : "";
};

export const salesApi = {
  list: (params: SalesListParams = {}): Promise<PagedResult<Sale>> =>
    USE_MOCK
      ? saleHandlers.list(params)
      : apiClient
          .get<PagedSaleDto | SaleDto[]>(`/api/sales${buildQuery(params)}`)
          .then(toPaged),

  get: (id: string): Promise<SaleDetail> =>
    USE_MOCK
      ? saleHandlers.getById(id)
      : apiClient.get<SaleDetailDto>(`/api/sales/${id}`).then(toSaleDetail),

  create: (input: CreateSaleInput) =>
    USE_MOCK
      ? saleHandlers.createSale(input)
      : apiClient.post<SaleDto>("/api/sales", input).then(toSale),

  update: (id: string, input: UpdateSaleInput) =>
    USE_MOCK
      ? saleHandlers.updateSale(id, input)
      : apiClient.put<SaleDto>(`/api/sales/${id}`, input).then(toSale),

  remove: (id: string) =>
    USE_MOCK
      ? saleHandlers.deleteSale(id)
      : apiClient.del<void>(`/api/sales/${id}`),
};

export type { CreateSaleInput, UpdateSaleInput };
