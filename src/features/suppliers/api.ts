/**
 * Suppliers API qatı — mock/real sərhədi.
 *
 * Backend SupplierDto: debt (qalıq), paidAmount, lastPaymentDate, itemCount
 * (bağlı məhsul sayı) (+ contactName). Adapter: remainingDebt=debt,
 * totalDebt=debt+paidAmount, paidAmount, lastPaymentDate və itemCount serverdən.
 * Qeyd: SupplierDto ilkin borcu ayrıca sahə kimi qaytarmır (Customer-dən fərqli) —
 * açılış balansı yalnız GET /api/suppliers/{id}/history-də "initialDebt" sətri kimi görünür.
 * Diqqət: POST /api/suppliers-də ilkin borc sahəsinin adı `debt`-dir
 * (CreateSupplierCommand.Debt), müştəridəki `initialDebt` deyil.
 */
import {
  supplierHandlers,
  type NewSupplier,
  type UpdateSupplier,
} from "@/mocks/handlers";
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
  // SupplierDto ilkin borcu ayrıca sahə kimi qaytarmır (o, `debt`-in içindədir),
  // ona görə real rejimdə həmişə 0 → ilkin borc sətri `listHistory`-dən gəlir.
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
/**
 * Mock tarixçə — real `GET /api/suppliers/{id}/history` ilə eyni nəticə:
 * xronoloji (köhnədən yeniyə) sıra, ilkin borc həmişə birinci sətir.
 *
 * Qeyd: mock ödənişlərin tarixi yalnız gün dəqiqliyindədir ("2026-07-27"),
 * `createdAt` isə tam ISO-dur — ona görə ilkin borc sıralamaya qatılmır,
 * açılış balansı təyinatına görə bütün əməliyyatlardan əvvəl gəlir.
 */
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
  const paymentsAsc = [...payments].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  for (const p of paymentsAsc) {
    entries.push({
      date: p.date,
      type: "payment",
      amount: p.amount,
      note: null,
    });
  }

  return entries;
}

export const suppliersApi = {
  list: () =>
    USE_MOCK
      ? supplierHandlers.list()
      : apiClient
          .get<SupplierDto[]>("/api/suppliers")
          .then((rows) => rows.map(toSupplier)),

  /**
   * Yalnız ödənişlər. UI-də ilkin borcu da göstərən `listHistory` istifadə olunur —
   * bu endpoint geriyə uyğunluq üçün saxlanılır (backend-də də belədir).
   */
  listPayments: (supplierId: string) =>
    USE_MOCK
      ? supplierHandlers.listPayments(supplierId)
      : apiClient
          .get<SupplierPaymentDto[]>(`/api/suppliers/${supplierId}/payments`)
          .then((rows) => rows.map(toPayment)),

  /** İlkin borc + ödənişlər — xronoloji (köhnədən yeniyə) sıra ilə. */
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
            phone: input.phone.trim() || null,
            note: input.note?.trim() || null,
            // Backend CreateSupplierCommand.Debt → JSON "debt" (Customer-dəki
            // "initialDebt"-dən fərqli sahə adı).
            debt: Math.max(0, Number(input.initialDebt) || 0),
          })
          .then(toSupplier),

  update: (id: string, input: UpdateSupplier) =>
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

export type { NewSupplier, UpdateSupplier };
