/**
 * Products API qatı — mock/real sərhədi.
 * VITE_API_URL təyin olunanda real API-yə keçir (hələ qoşulmayıb).
 */
import {
  productHandlers,
  type NewProduct,
  type ProductUpdate,
} from "@/mocks/handlers";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const productsApi = {
  list: () => (USE_MOCK ? productHandlers.list() : notImplemented()),
  get: (id: string) => (USE_MOCK ? productHandlers.get(id) : notImplemented()),
  create: (input: NewProduct) =>
    USE_MOCK ? productHandlers.create(input) : notImplemented(),
  update: (id: string, input: ProductUpdate) =>
    USE_MOCK ? productHandlers.update(id, input) : notImplemented(),
  adjustStock: (id: string, delta: number, reason?: string) =>
    USE_MOCK ? productHandlers.adjustStock(id, delta, reason) : notImplemented(),
};

export type { NewProduct, ProductUpdate };
