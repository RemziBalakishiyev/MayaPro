/**
 * localStorage-əsaslı mock "verilənlər bazası".
 * Hər əməliyyat süni 300ms gecikmə ilə real şəbəkə hissi verir.
 * İlk açılışda (və ya seed versiyası dəyişəndə) seed data yüklənir.
 */
import { buildSeed, SEED_VERSION, type SeedDatabase } from "./seed";
import type {
  Product,
  Sale,
  Customer,
  Supplier,
  Expense,
  Employee,
  Closing,
  Activity,
  CustomerPayment,
  SupplierPayment,
  Category,
} from "@/types";

const DB_KEY = "sederek-db";
const VERSION_KEY = "sederek-db-version";

export const sleep = (ms = 300) => new Promise<void>((r) => setTimeout(r, ms));

interface Entity {
  id: string;
}
type Database = SeedDatabase;
type CollectionName = keyof Database;

function ensureSeeded(): void {
  const versionOk = localStorage.getItem(VERSION_KEY) === String(SEED_VERSION);
  if (!localStorage.getItem(DB_KEY) || !versionOk) {
    localStorage.setItem(DB_KEY, JSON.stringify(buildSeed()));
    localStorage.setItem(VERSION_KEY, String(SEED_VERSION));
  }
}

function readAll(): Database {
  ensureSeeded();
  return JSON.parse(localStorage.getItem(DB_KEY) as string) as Database;
}

function writeAll(data: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

/** Generik kolleksiya: list / get / create / update / remove. */
function collection<T extends Entity>(name: CollectionName) {
  const rows = (data: Database) => data[name] as unknown as T[];

  return {
    async list(): Promise<T[]> {
      await sleep();
      return rows(readAll()) ?? [];
    },
    async get(id: string): Promise<T | undefined> {
      await sleep();
      return rows(readAll()).find((x) => x.id === id);
    },
    async create(item: T): Promise<T> {
      await sleep();
      const data = readAll();
      (data[name] as unknown as T[]) = [item, ...rows(data)];
      writeAll(data);
      return item;
    },
    async update(id: string, patch: Partial<T>): Promise<T> {
      await sleep();
      const data = readAll();
      let updated: T | undefined;
      (data[name] as unknown as T[]) = rows(data).map((x) => {
        if (x.id !== id) return x;
        updated = { ...x, ...patch };
        return updated;
      });
      if (!updated) throw new Error(`${name}: "${id}" tapılmadı`);
      writeAll(data);
      return updated;
    },
    async remove(id: string): Promise<void> {
      await sleep();
      const data = readAll();
      (data[name] as unknown as T[]) = rows(data).filter((x) => x.id !== id);
      writeAll(data);
    },
  };
}

export const db = {
  products: collection<Product>("products"),
  categories: collection<Category>("categories"),
  sales: collection<Sale>("sales"),
  customers: collection<Customer>("customers"),
  suppliers: collection<Supplier>("suppliers"),
  expenses: collection<Expense>("expenses"),
  employees: collection<Employee>("employees"),
  closings: collection<Closing>("closings"),
  activity: collection<Activity>("activity"),
  payments: collection<CustomerPayment>("payments"),
  supplierPayments: collection<SupplierPayment>("supplierPayments"),
};

/** localStorage-i sıfırlayıb seed-i yenidən yükləyir (debug üçün). */
export const resetDb = () => {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(VERSION_KEY);
  ensureSeeded();
};
