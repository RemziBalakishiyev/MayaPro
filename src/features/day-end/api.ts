/**
 * Day-end API qatı — mock/real sərhədi.
 */
import { closingHandlers } from "@/mocks/handlers";
import type { Closing } from "@/types";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const closingsApi = {
  list: () => (USE_MOCK ? closingHandlers.list() : notImplemented()),
  closeDay: (input: Omit<Closing, "id">) =>
    USE_MOCK ? closingHandlers.closeDay(input) : notImplemented(),
};
