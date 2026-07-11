/**
 * Customers API qatı — mock/real sərhədi.
 *
 * Backend CustomerDto: debt (qalıq), paidAmount, lastPurchaseDate, lastPaymentDate.
 * Adapter: remainingDebt=debt, totalDebt=debt+paidAmount (ümumi=qalıq+ödənilmiş),
 * paidAmount və tarixlər birbaşa serverdən.
 */
import { db } from "@/mocks/db";
import { saleHandlers } from "@/mocks/handlers";
import { uid } from "@/lib/format";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Customer, CustomerPayment } from "@/types";

export interface NewCustomer {
  name: string;
  phone: string;
  note?: string;
}

interface CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  debt: number;
  paidAmount: number;
  lastPurchaseDate: string | null;
  lastPaymentDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerPaymentDto {
  id: string;
  customerId: string;
  amount: number;
  note: string | null;
  receivedByUserId: string | null;
  date: string;
}

const toCustomer = (d: CustomerDto): Customer => ({
  id: d.id,
  name: d.name,
  phone: d.phone ?? "",
  totalDebt: d.debt + d.paidAmount,
  paidAmount: d.paidAmount,
  remainingDebt: d.debt,
  lastPurchaseDate: d.lastPurchaseDate ?? "",
  lastPaymentDate: d.lastPaymentDate ?? "",
});

const toPayment = (d: CustomerPaymentDto): CustomerPayment => ({
  id: d.id,
  customerId: d.customerId,
  amount: d.amount,
  date: d.date,
  method: "Nağd",
  note: d.note ?? undefined,
});

// ——— Mock köməkçiləri ———
async function mockCreate(input: NewCustomer): Promise<Customer> {
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

async function mockListPayments(customerId: string): Promise<CustomerPayment[]> {
  const all = await db.payments.list();
  return all.filter((p) => p.customerId === customerId);
}

export const customersApi = {
  list: () =>
    USE_MOCK
      ? db.customers.list()
      : apiClient
          .get<CustomerDto[]>("/api/customers")
          .then((rows) => rows.map(toCustomer)),

  create: (input: NewCustomer) =>
    USE_MOCK
      ? mockCreate(input)
      : apiClient
          .post<CustomerDto>("/api/customers", {
            name: input.name.trim(),
            phone: input.phone.trim(),
            note: input.note,
          })
          .then(toCustomer),

  listPayments: (customerId: string) =>
    USE_MOCK
      ? mockListPayments(customerId)
      : apiClient
          .get<CustomerPaymentDto[]>(`/api/customers/${customerId}/payments`)
          .then((rows) => rows.map(toPayment)),

  addPayment: (customerId: string, amount: number, note?: string) =>
    USE_MOCK
      ? saleHandlers.addCustomerPayment(customerId, amount, note)
      : apiClient
          .post<CustomerPaymentDto>(`/api/customers/${customerId}/payments`, {
            amount,
            note,
          })
          .then((d) => (d ? toPayment(d) : ({} as CustomerPayment))),
};
