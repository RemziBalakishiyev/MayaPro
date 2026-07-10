/**
 * Suppliers API qatı — mock/real sərhədi.
 */
import { supplierHandlers, type NewSupplier } from "@/mocks/handlers";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export const suppliersApi = {
  list: () => (USE_MOCK ? supplierHandlers.list() : notImplemented()),
  listPayments: (supplierId: string) =>
    USE_MOCK ? supplierHandlers.listPayments(supplierId) : notImplemented(),
  create: (input: NewSupplier) =>
    USE_MOCK ? supplierHandlers.create(input) : notImplemented(),
  addDebt: (supplierId: string, amount: number) =>
    USE_MOCK ? supplierHandlers.addDebt(supplierId, amount) : notImplemented(),
  addPayment: (supplierId: string, amount: number) =>
    USE_MOCK ? supplierHandlers.addPayment(supplierId, amount) : notImplemented(),
};

export type { NewSupplier };
