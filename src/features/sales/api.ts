/**
 * Sales API qatı — mock/real sərhədi.
 */
import { saleHandlers, type CreateSaleInput } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Sale } from "@/types";

/** Backend SaleDto → frontend Sale (null sahələr normallaşdırılır). */
interface SaleDto extends Omit<Sale, "customerId" | "employeeId"> {
  customerId: string | null;
  employeeId: string | null;
  soldByName?: string;
}

const toSale = (d: SaleDto): Sale => ({
  ...d,
  customerId: d.customerId ?? null,
  employeeId: d.employeeId ?? "",
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
