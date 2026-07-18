/**
 * Sales API qatı — mock/real sərhədi.
 */
import { saleHandlers } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { CreateSaleInput } from "@/features/sales/types";
import type { Sale } from "@/types";

/** Backend SaleDto → frontend Sale (null sahələr normallaşdırılır). */
interface SaleDto extends Omit<Sale, "customerId" | "employeeId" | "isManual"> {
  customerId: string | null;
  employeeId: string | null;
  isManual?: boolean;
  soldByName?: string;
}

const toSale = (d: SaleDto): Sale => ({
  ...d,
  customerId: d.customerId ?? null,
  employeeId: d.employeeId ?? "",
  isManual: d.isManual ?? false,
});

export const salesApi = {
  list: (date?: string) =>
    USE_MOCK
      ? saleHandlers.list()
      : apiClient
          .get<SaleDto[]>(`/api/sales${date ? `?date=${date}` : ""}`)
          .then((rows) => rows.map(toSale)),

  create: (input: CreateSaleInput) =>
    USE_MOCK
      ? saleHandlers.createSale(input)
      : apiClient.post<SaleDto>("/api/sales", input).then(toSale),
};

export type { CreateSaleInput };
