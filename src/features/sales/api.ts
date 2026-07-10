/**
 * Sales API qatı — mock/real sərhədi.
 */
import { saleHandlers, type CreateSaleInput } from "@/mocks/handlers";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const salesApi = {
  list: () => (USE_MOCK ? saleHandlers.list() : notImplemented()),
  create: (input: CreateSaleInput) =>
    USE_MOCK ? saleHandlers.createSale(input) : notImplemented(),
};

export type { CreateSaleInput };
