/**
 * Sales API qatı — mock/real sərhədi.
 */
import { saleHandlers } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { PagedResult } from "@/lib/paging";
import type { CreateSaleInput, SalesListParams } from "@/features/sales/types";
import type { Sale } from "@/types";

export type { SalesListParams };

/** Backend SaleDto → frontend Sale (null sahələr normallaşdırılır). */
interface SaleDto extends Omit<Sale, "customerId" | "employeeId" | "isManual"> {
  customerId: string | null;
  employeeId: string | null;
  isManual?: boolean;
  soldByName?: string | null;
}

interface PagedSaleDto {
  items?: SaleDto[];
  Items?: SaleDto[];
  totalCount?: number;
  TotalCount?: number;
}

const toSale = (d: SaleDto): Sale => ({
  ...d,
  customerId: d.customerId ?? null,
  employeeId: d.employeeId ?? "",
  isManual: d.isManual ?? false,
  soldByName: d.soldByName ?? null,
  category: d.category ?? null,
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

  create: (input: CreateSaleInput) =>
    USE_MOCK
      ? saleHandlers.createSale(input)
      : apiClient.post<SaleDto>("/api/sales", input).then(toSale),
};

export type { CreateSaleInput };
