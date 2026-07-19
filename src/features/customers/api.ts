/**
 * Customers API qatı — mock/real sərhədi.
 *
 * Backend CustomerDto: debt (qalıq), paidAmount, initialDebt, lastPurchaseDate, lastPaymentDate.
 * Adapter: remainingDebt=debt, totalDebt=debt+paidAmount (ümumi=qalıq+ödənilmiş),
 * paidAmount və tarixlər birbaşa serverdən.
 */
import { db } from "@/mocks/db";
import { saleHandlers } from "@/mocks/handlers";
import { uid, todayISO } from "@/lib/format";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Customer, CustomerHistoryEntry, CustomerPayment } from "@/types";

export interface NewCustomer {
  name: string;
  phone: string;
  note?: string;
  /** Köhnə dəftərdən qalan açılış borcu (≥ 0). */
  initialDebt?: number;
}

interface CustomerDto {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
  debt: number;
  initialDebt: number;
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

interface CustomerHistoryEntryDto {
  date: string;
  type: "initialDebt" | "sale" | "payment";
  amount: number;
  note: string | null;
}

const INITIAL_DEBT_NOTE = "İlkin borc (sistemə keçid)";

const toCustomer = (d: CustomerDto): Customer => ({
  id: d.id,
  name: d.name,
  phone: d.phone ?? "",
  totalDebt: d.debt + d.paidAmount,
  paidAmount: d.paidAmount,
  remainingDebt: d.debt,
  initialDebt: d.initialDebt ?? 0,
  lastPurchaseDate: d.lastPurchaseDate ?? "",
  lastPaymentDate: d.lastPaymentDate ?? "",
  createdAt: d.createdAt,
});

const toPayment = (d: CustomerPaymentDto): CustomerPayment => ({
  id: d.id,
  customerId: d.customerId,
  amount: d.amount,
  date: d.date,
  method: "Nağd",
  note: d.note ?? undefined,
});

const toHistoryEntry = (d: CustomerHistoryEntryDto): CustomerHistoryEntry => ({
  date: d.date,
  type: d.type,
  amount: d.amount,
  note: d.note,
});

// ——— Mock köməkçiləri ———
async function mockCreate(input: NewCustomer): Promise<Customer> {
  const debt = Math.max(0, Number(input.initialDebt) || 0);
  const createdAt = new Date().toISOString();
  const customer: Customer = {
    id: uid("cus"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    totalDebt: debt,
    paidAmount: 0,
    remainingDebt: debt,
    initialDebt: debt,
    lastPurchaseDate: "",
    lastPaymentDate: "",
    createdAt,
  };
  return db.customers.create(customer);
}

async function mockListPayments(customerId: string): Promise<CustomerPayment[]> {
  const all = await db.payments.list();
  return all.filter((p) => p.customerId === customerId);
}

async function mockListHistory(
  customerId: string,
): Promise<CustomerHistoryEntry[]> {
  const customer = await db.customers.get(customerId);
  if (!customer) return [];

  const entries: CustomerHistoryEntry[] = [];

  if ((customer.initialDebt ?? 0) > 0) {
    entries.push({
      date: customer.createdAt || todayISO(),
      type: "initialDebt",
      amount: customer.initialDebt,
      note: INITIAL_DEBT_NOTE,
    });
  }

  const sales = await db.sales.list();
  for (const s of sales) {
    if (s.customerId !== customerId || s.paymentType !== "Nisyə") continue;
    entries.push({
      date: s.createdAt,
      type: "sale",
      amount: s.totalAmount,
      note: `${s.productName} × ${s.quantity}`,
    });
  }

  const payments = await mockListPayments(customerId);
  for (const p of payments) {
    entries.push({
      date: p.date,
      type: "payment",
      amount: p.amount,
      note: p.note ?? null,
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export const customersApi = {
  list: () =>
    USE_MOCK
      ? db.customers.list().then((rows) =>
          rows.map((c) => ({
            ...c,
            initialDebt: c.initialDebt ?? 0,
          })),
        )
      : apiClient
          .get<CustomerDto[]>("/api/customers")
          .then((rows) => rows.map(toCustomer)),

  create: (input: NewCustomer) =>
    USE_MOCK
      ? mockCreate(input)
      : apiClient
          .post<CustomerDto>("/api/customers", {
            name: input.name.trim(),
            phone: input.phone.trim() || null,
            note: input.note,
            initialDebt: Math.max(0, Number(input.initialDebt) || 0),
          })
          .then(toCustomer),

  listPayments: (customerId: string) =>
    USE_MOCK
      ? mockListPayments(customerId)
      : apiClient
          .get<CustomerPaymentDto[]>(`/api/customers/${customerId}/payments`)
          .then((rows) => rows.map(toPayment)),

  listHistory: (customerId: string) =>
    USE_MOCK
      ? mockListHistory(customerId)
      : apiClient
          .get<CustomerHistoryEntryDto[]>(
            `/api/customers/${customerId}/history`,
          )
          .then((rows) => rows.map(toHistoryEntry)),

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
