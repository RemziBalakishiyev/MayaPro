/**
 * Day-end API qatı — mock/real sərhədi.
 *
 * Gün cəmləri (nağd/kart/nisyə satış, xərc) serverdə hesablanır; POST yalnız
 * openingCash, actualCash, note göndərir və cavabda tam ClosingDto qayıdır.
 */
import { closingHandlers, type CloseDayInput } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Closing } from "@/types";

/** Backend ClosingDto əlavə sahələr də verir (closedByUserId, note, createdAt) —
 *  frontend Closing yalnız lazım olanları götürür (date DateOnly "YYYY-MM-DD"). */
type ClosingDto = Closing & {
  closedByUserId?: string | null;
  note?: string | null;
  createdAt?: string;
};

export const closingsApi = {
  list: () =>
    USE_MOCK
      ? closingHandlers.list()
      : apiClient.get<ClosingDto[]>("/api/closings"),

  /** Bugünkü bağlanış (yoxdursa 204 → null). */
  today: () =>
    USE_MOCK
      ? closingHandlers.today()
      : apiClient.get<ClosingDto | null>("/api/closings/today"),

  closeDay: (input: CloseDayInput) =>
    USE_MOCK
      ? closingHandlers.closeDay(input)
      : apiClient.post<ClosingDto>("/api/closings", {
          openingCash: input.openingCash,
          actualCash: input.actualCash,
          note: input.note,
        }),
};

export type { CloseDayInput };
