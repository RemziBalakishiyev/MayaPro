/**
 * Reports/Dashboard API qatı — bütün kolleksiyaları paralel oxuyur.
 */
import { db } from "@/mocks/db";
import type {
  Product,
  Sale,
  Customer,
  Supplier,
  Expense,
  Employee,
  Closing,
  CustomerPayment,
} from "@/types";

export interface DashboardData {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  closings: Closing[];
  payments: CustomerPayment[];
}

export const reportsApi = {
  async getAll(): Promise<DashboardData> {
    const [
      products,
      sales,
      customers,
      suppliers,
      expenses,
      employees,
      closings,
      payments,
    ] = await Promise.all([
      db.products.list(),
      db.sales.list(),
      db.customers.list(),
      db.suppliers.list(),
      db.expenses.list(),
      db.employees.list(),
      db.closings.list(),
      db.payments.list(),
    ]);
    return {
      products,
      sales,
      customers,
      suppliers,
      expenses,
      employees,
      closings,
      payments,
    };
  },
};
