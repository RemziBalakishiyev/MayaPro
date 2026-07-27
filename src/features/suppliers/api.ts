/**
 * Suppliers API qatı — mock/real sərhədi.
 *
 * Backend SupplierDto: debt (qalıq), paidAmount, lastPaymentDate, itemCount
 * (bağlı məhsul sayı) (+ contactName). Adapter: remainingDebt=debt,
 * totalDebt=debt+paidAmount, paidAmount, lastPaymentDate və itemCount serverdən.
 * Qeyd: SupplierDto ilkin borcu ayrıca sahə kimi qaytarmır (Customer-dən fərqli) —
 * açılış balansı yalnız GET /api/suppliers/{id}/history-də "initialDebt" sətri kimi görünür.
 */
import { supplierHandlers, type NewSupplier } from "@/mocks/handlers";
import { db } from "@/mocks/db";
import { todayISO } from "@/lib/format";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Supplier, SupplierHistoryEntry, SupplierPayment } from "@/types";

interface SupplierDto {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  note: string | null;
  debt: number;
  paidAmount: number;
  lastPaymentDate: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

interface SupplierPaymentDto {
  id: string;
  supplierId: string;
  amount: number;
  note: string | null;
  paidByUserId: string | null;
  date: string;
}

interface SupplierHistoryEntryDto {
  date: string;
  type: "initialDebt" | "payment";
  amount: number;
  note: string | null;
}

const INITIAL_DEBT_NOTE = "İlkin borc (sistemə keçid)";

const toSupplier = (d: SupplierDto): Supplier => ({
  id: d.id,
  name: d.name,
  phone: d.phone ?? "",
  note: d.note ?? "",
  totalDebt: d.debt + d.paidAmount,
  paidAmount: d.paidAmount,
  remainingDebt: d.debt,
  // Real backend siyahıda ilkin borcu ayrıca göndərmir — tarixçədən görünür.
  initialDebt: 0,
  itemCount: d.itemCount ?? 0,
  lastPaymentDate: d.lastPaymentDate ?? "",
  createdAt: d.createdAt,
});

const toPayment = (d: SupplierPaymentDto): SupplierPayment => ({
  id: d.id,
  supplierId: d.supplierId,
  amount: d.amount,
  date: d.date,
});

const toHistoryEntry = (d: SupplierHistoryEntryDto): SupplierHistoryEntry => ({
  date: d.date,
  type: d.type,
  amount: d.amount,
  note: d.note,
});

// ——— Mock köməkçiləri ———
async function mockListHistory(
  supplierId: string,
): Promise<SupplierHistoryEntry[]> {
  const supplier = await db.suppliers.get(supplierId);
  if (!supplier) return [];

  const entries: SupplierHistoryEntry[] = [];

  if ((supplier.initialDebt ?? 0) > 0) {
    entries.push({
      date: supplier.createdAt || todayISO(),
      type: "initialDebt",
      amount: supplier.initialDebt,
      note: INITIAL_DEBT_NOTE,
    });
  }

  const payments = await supplierHandlers.listPayments(supplierId);
  for (const p of payments) {
    entries.push({
      date: p.date,
      type: "payment",
      amount: p.amount,
      note: null,
    });
  }

  return entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export const suppliersApi = {
  list: () =>
    USE_MOCK
      ? supplierHandlers.list()
      : apiClient
          .get<SupplierDto[]>("/api/suppliers")
          .then((rows) => rows.map(toSupplier)),

  listPayments: (supplierId: string) =>
    USE_MOCK
      ? supplierHandlers.listPayments(supplierId)
      : apiClient
          .get<SupplierPaymentDto[]>(`/api/suppliers/${supplierId}/payments`)
          .then((rows) => rows.map(toPayment)),

  listHistory: (supplierId: string) =>
    USE_MOCK
      ? mockListHistory(supplierId)
      : apiClient
          .get<SupplierHistoryEntryDto[]>(
            `/api/suppliers/${supplierId}/history`,
          )
          .then((rows) => rows.map(toHistoryEntry)),

  create: (input: NewSupplier) =>
    USE_MOCK
      ? supplierHandlers.create(input)
      : apiClient
          .post<SupplierDto>("/api/suppliers", {
            name: input.name.trim(),
            phone: input.phone.trim(),
            note: input.note,
            // Backend CreateSupplierCommand.Debt → JSON "debt" (Customer-dəki
            // "initialDebt"-dən fərqli sahə adı).
            debt: Math.max(0, Number(input.initialDebt) || 0),
          })
          .then(toSupplier),

  update: (id: string, input: NewSupplier) =>
    USE_MOCK
      ? supplierHandlers.update(id, input)
      : apiClient
          .put<SupplierDto>(`/api/suppliers/${id}`, {
            name: input.name.trim(),
            phone: input.phone.trim() || null,
            note: input.note?.trim() || null,
          })
          .then(toSupplier),

  remove: (id: string) =>
    USE_MOCK
      ? supplierHandlers.remove(id)
      : apiClient.del<void>(`/api/suppliers/${id}`),

  addDebt: (supplierId: string, amount: number) =>
    USE_MOCK
      ? supplierHandlers.addDebt(supplierId, amount)
      : apiClient
          .post<SupplierDto>(`/api/suppliers/${supplierId}/debts`, { amount })
          .then((d) => (d ? toSupplier(d) : ({} as Supplier))),

  addPayment: (supplierId: string, amount: number) =>
    USE_MOCK
      ? supplierHandlers.addPayment(supplierId, amount)
      : apiClient
          .post<SupplierPaymentDto>(`/api/suppliers/${supplierId}/payments`, {
            amount,
          })
          .then((d) => (d ? toPayment(d) : ({} as SupplierPayment))),
};

export type { NewSupplier };
