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
import type { ImportPreviewResponse } from "./types";

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

  /**
   * Barkod generasiyası — yalnız real backend.
   * Mock rejimdə "Barkod/QR çap" düyməsi modalı açmır (info toast), ona görə
   * bu funksiya mock rejimdə heç vaxt çağırılmır.
   */
  generateBarcode: (id: string) =>
    apiClient.post<Product>(`/api/products/${id}/generate-barcode`),
};

/**
 * Excel idxalı (BE#13) — yalnız real backend rejimində açılır (`USE_MOCK`
 * olanda modal heç açılmır), ona görə mock qatına ehtiyac yoxdur.
 */
export const productImportsApi = {
  /** Multipart fayl yükləməsi — sahə adı backend-in gözlədiyi kimi "file". */
  preview: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postForm<ImportPreviewResponse>(
      "/api/imports/products/preview",
      formData,
    );
  },

  commit: (importToken: string) =>
    apiClient.post<void>("/api/imports/products/commit", { importToken }),
};

export type { NewProduct, ProductUpdate };
