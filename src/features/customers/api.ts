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
import type {
  Customer,
  CustomerHistoryEntry,
  CustomerPayment,
  PaymentType,
} from "@/types";

export interface NewCustomer {
  name: string;
  phone: string;
  note?: string;
  /** Köhnə dəftərdən qalan açılış borcu (≥ 0). */
  initialDebt?: number;
}

export interface UpdateCustomer {
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
  initialDebt: number;
  paidAmount: number;
  /** Bütün satışların yekun cəmi (nağd + kart + nisyə). */
  totalPurchases: number;
  purchaseCount: number;
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
  /** type === "sale" olduqda satışın id-si */
  saleId?: string | null;
  /** type === "sale" olduqda ödəniş növü — nağd/kart/nisyə */
  paymentType?: PaymentType | null;
}

const INITIAL_DEBT_NOTE = "İlkin borc (sistemə keçid)";

const toCustomer = (d: CustomerDto): Customer => ({
  id: d.id,
  name: d.name,
  phone: d.phone ?? "",
  note: d.note ?? "",
  totalDebt: d.debt + d.paidAmount,
  paidAmount: d.paidAmount,
  remainingDebt: d.debt,
  initialDebt: d.initialDebt ?? 0,
  totalPurchases: d.totalPurchases ?? 0,
  purchaseCount: d.purchaseCount ?? 0,
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
  saleId: d.type === "sale" ? (d.saleId ?? null) : null,
  paymentType: d.type === "sale" ? (d.paymentType ?? null) : null,
});

// ——— Mock köməkçiləri ———
async function mockCreate(input: NewCustomer): Promise<Customer> {
  const debt = Math.max(0, Number(input.initialDebt) || 0);
  const createdAt = new Date().toISOString();
  const customer: Customer = {
    id: uid("cus"),
    name: input.name.trim(),
    phone: input.phone.trim(),
    note: input.note?.trim() || "",
    totalDebt: debt,
    paidAmount: 0,
    remainingDebt: debt,
    initialDebt: debt,
    totalPurchases: 0,
    purchaseCount: 0,
    lastPurchaseDate: "",
    lastPaymentDate: "",
    createdAt,
  };
  return db.customers.create(customer);
}

async function mockUpdate(
  id: string,
  input: UpdateCustomer,
): Promise<Customer> {
  const c = await db.customers.get(id);
  if (!c) throw new Error("Müştəri tapılmadı");
  return db.customers.update(id, {
    name: input.name.trim(),
    phone: input.phone.trim(),
    note: input.note?.trim() || "",
  });
}

async function mockRemove(id: string): Promise<void> {
  const c = await db.customers.get(id);
  if (!c) throw new Error("Müştəri tapılmadı");
  // Borclu olsa belə silinə bilər —
  //  · Nisyə satışlar tam silinir (stok geri qayıdır, borc təmizlənir)
  //  · Nağd/kart satışlar qalır, sadəcə müştəri bağı düşür
  const sales = await db.sales.list();
  for (const s of sales) {
    if (s.customerId !== id) continue;
    if (s.paymentType === "Nisyə") {
      if (s.productId && !s.isManual) {
        const p = await db.products.get(s.productId);
        if (p) {
          await db.products.update(p.id, {
            quantity: p.quantity + s.quantity,
            updatedAt: todayISO(),
          });
        }
      }
      await db.sales.remove(s.id);
    } else {
      await db.sales.update(s.id, { customerId: null });
    }
  }
  const payments = await db.payments.list();
  for (const p of payments) {
    if (p.customerId === id) await db.payments.remove(p.id);
  }
  await db.customers.remove(id);
}

async function mockRemoveCredit(
  customerId: string,
  saleId: string,
): Promise<void> {
  await saleHandlers.deleteCustomerCredit(customerId, saleId);
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
    if (s.customerId !== customerId) continue;
    entries.push({
      date: s.createdAt,
      type: "sale",
      amount: s.totalAmount,
      note: `${s.productName} × ${s.quantity}`,
      saleId: s.id,
      paymentType: s.paymentType,
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

/** Mock: müştərinin bütün satışlardan yekunu — cash/card/nisyə birgə. */
async function mockAggregatePurchases(): Promise<
  Map<string, { total: number; count: number; last: string }>
> {
  const map = new Map<string, { total: number; count: number; last: string }>();
  const sales = await db.sales.list();
  for (const s of sales) {
    if (!s.customerId) continue;
    const cur = map.get(s.customerId) ?? { total: 0, count: 0, last: "" };
    cur.total += s.totalAmount;
    cur.count += 1;
    if (!cur.last || s.createdAt > cur.last) cur.last = s.createdAt;
    map.set(s.customerId, cur);
  }
  return map;
}

export const customersApi = {
  list: async () => {
    if (!USE_MOCK) {
      const rows = await apiClient.get<CustomerDto[]>("/api/customers");
      return rows.map(toCustomer);
    }
    const [rows, purchases] = await Promise.all([
      db.customers.list(),
      mockAggregatePurchases(),
    ]);
    return rows.map((c) => {
      const p = purchases.get(c.id);
      return {
        ...c,
        initialDebt: c.initialDebt ?? 0,
        totalPurchases: p?.total ?? c.totalPurchases ?? 0,
        purchaseCount: p?.count ?? c.purchaseCount ?? 0,
        lastPurchaseDate: p?.last || c.lastPurchaseDate || "",
      };
    });
  },

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

  update: (id: string, input: UpdateCustomer) =>
    USE_MOCK
      ? mockUpdate(id, input)
      : apiClient
          .put<CustomerDto>(`/api/customers/${id}`, {
            name: input.name.trim(),
            phone: input.phone.trim() || null,
            note: input.note?.trim() || null,
          })
          .then(toCustomer),

  remove: (id: string) =>
    USE_MOCK
      ? mockRemove(id)
      : apiClient.del<void>(`/api/customers/${id}`),

  /** Nisyə borc sətri — DELETE /api/customers/{id}/credits/{saleId} */
  removeCredit: (customerId: string, saleId: string) =>
    USE_MOCK
      ? mockRemoveCredit(customerId, saleId)
      : apiClient.del<void>(
          `/api/customers/${customerId}/credits/${saleId}`,
        ),

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
