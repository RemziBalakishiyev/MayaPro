/**
 * Customers API qatı — mock/real sərhədi.
 */
import { db } from "@/mocks/db";
import { saleHandlers } from "@/mocks/handlers";
import { uid } from "@/lib/format";
import type { Customer, CustomerPayment } from "@/types";

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

async function listPayments(customerId: string): Promise<CustomerPayment[]> {
  const all = await db.payments.list();
  return all.filter((p) => p.customerId === customerId);
}

export const customersApi = {
  list: () => (USE_MOCK ? db.customers.list() : notImplemented()),
  create: (input: NewCustomer) =>
    USE_MOCK ? createCustomer(input) : notImplemented(),
  listPayments: (customerId: string) =>
    USE_MOCK ? listPayments(customerId) : notImplemented(),
  addPayment: (customerId: string, amount: number, note?: string) =>
    USE_MOCK
      ? saleHandlers.addCustomerPayment(customerId, amount, note)
      : notImplemented(),
};
