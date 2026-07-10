/**
 * Employees + Activity API qatı — mock/real sərhədi.
 */
import { db } from "@/mocks/db";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const employeesApi = {
  list: () => (USE_MOCK ? db.employees.list() : notImplemented()),
  activity: () => (USE_MOCK ? db.activity.list() : notImplemented()),
};
