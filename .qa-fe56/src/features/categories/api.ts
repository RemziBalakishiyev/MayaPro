/**
 * Kateqoriyalar API qatı — mock/real sərhədi.
 *
 * Backend: GET /api/categories → [{ id, name }], POST /api/categories { name }.
 * Mock: localStorage-dakı categories kolleksiyası.
 */
import { categoryHandlers } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Category } from "@/types";

export const categoriesApi = {
  list: (): Promise<Category[]> =>
    USE_MOCK
      ? categoryHandlers.list()
      : apiClient.get<Category[]>("/api/categories"),

  create: (name: string): Promise<Category> =>
    USE_MOCK
      ? categoryHandlers.create(name)
      : apiClient.post<Category>("/api/categories", { name: name.trim() }),
};
