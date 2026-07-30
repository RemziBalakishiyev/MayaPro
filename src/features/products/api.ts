/**
 * Products API qatı — mock/real sərhədi.
 * VITE_API_URL təyin olunanda real backend-ə keçir.
 */
import {
  productHandlers,
  type NewProduct,
  type ProductUpdate,
} from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Product } from "@/types";

export const productsApi = {
  list: () =>
    USE_MOCK
      ? productHandlers.list()
      : apiClient.get<Product[]>("/api/products"),

  get: (id: string) =>
    USE_MOCK
      ? productHandlers.get(id)
      : apiClient.get<Product>(`/api/products/${id}`),

  create: (input: NewProduct) =>
    USE_MOCK
      ? productHandlers.create(input)
      : apiClient.post<Product>("/api/products", input),

  update: (id: string, input: ProductUpdate) =>
    USE_MOCK
      ? productHandlers.update(id, input)
      : apiClient.put<Product>(`/api/products/${id}`, { id, ...input }),

  adjustStock: (id: string, delta: number, reason?: string) =>
    USE_MOCK
      ? productHandlers.adjustStock(id, delta, reason)
      : apiClient.post<Product>(`/api/products/${id}/adjust-stock`, {
          delta,
          note: reason,
        }),

  remove: (id: string) =>
    USE_MOCK
      ? productHandlers.remove(id)
      : apiClient.del<void>(`/api/products/${id}`),
};

export type { NewProduct, ProductUpdate };
