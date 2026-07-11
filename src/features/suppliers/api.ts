/**
 * Suppliers API qatı — mock/real sərhədi.
 *
 * DİQQƏT (DTO uyğunsuzluğu): backend SupplierDto tək `debt` sahəsi verir;
 * frontend Supplier isə totalDebt/paidAmount/remainingDebt/itemCount/
 * lastPaymentDate gözləyir. Adapterdə remainingDebt=totalDebt=debt, qalanlar
 * 0/boş. Backend-də `contactName` var, frontend istifadə etmir.
 */
import { supplierHandlers, type NewSupplier } from "@/mocks/handlers";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import type { Supplier, SupplierPayment } from "@/types";

interface SupplierDto {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  note: string | null;
  debt: number;
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

const toSupplier = (d: SupplierDto): Supplier => ({
  id: d.id,
  name: d.name,
  phone: d.phone ?? "",
  totalDebt: d.debt,
  paidAmount: 0,
  remainingDebt: d.debt,
  itemCount: 0,
  lastPaymentDate: "",
});

const toPayment = (d: SupplierPaymentDto): SupplierPayment => ({
  id: d.id,
  supplierId: d.supplierId,
  amount: d.amount,
  date: d.date,
});

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

  create: (input: NewSupplier) =>
    USE_MOCK
      ? supplierHandlers.create(input)
      : apiClient
          .post<SupplierDto>("/api/suppliers", {
            name: input.name.trim(),
            phone: input.phone.trim(),
            note: input.note,
          })
          .then(toSupplier),

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
