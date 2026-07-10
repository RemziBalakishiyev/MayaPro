/**
 * Customers API qatı — mock/real sərhədi.
 */
import { db } from "@/mocks/db";
import { uid } from "@/lib/format";
import type { Customer } from "@/types";

const USE_MOCK = !import.meta.env.VITE_API_URL;

const notImplemented = (): never => {
  throw new Error("Real API hələ qoşulmayıb — VITE_API_URL-i silin.");
};

export interface NewCustomer {
  name: string;
  phone: string;
  note?: string;
}

async function createCustomer(input: NewCustomer): Promise<Customer> {
  const customer: Customer = {
    id: uid("cus"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    totalDebt: 0,
    paidAmount: 0,
    remainingDebt: 0,
    lastPurchaseDate: "",
    lastPaymentDate: "",
  };
  return db.customers.create(customer);
}

export const customersApi = {
  list: () => (USE_MOCK ? db.customers.list() : notImplemented()),
  create: (input: NewCustomer) =>
    USE_MOCK ? createCustomer(input) : notImplemented(),
};
