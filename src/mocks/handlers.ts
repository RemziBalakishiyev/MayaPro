/** Biznes məntiqli mock əməliyyatlar (hələlik yalnız products üçün). */
import { db } from "./db";
import { calcRealCost } from "@/features/products/lib";
import { uid, todayISO } from "@/lib/format";
import { useAuthStore } from "@/features/auth/store";
import type { Product } from "@/types";

/** Yeni mal üçün giriş — hesablanan/avtomatik sahələr xaric. */
export type NewProduct = Omit<
  Product,
  "id" | "realCostPerUnit" | "initialQuantity" | "createdAt" | "updatedAt"
>;

/** Mövcud malın yenilənməsi üçün giriş (initialQuantity yaradılışda sabitlənir). */
export type ProductUpdate = NewProduct;

async function logActivity(action: string, detail: string): Promise<void> {
  const employeeId = useAuthStore.getState().user?.id ?? "emp_1";
  await db.activity.create({
    id: uid("act"),
    employeeId,
    action,
    detail,
    date: todayISO(),
  });
}

export const productHandlers = {
  list: () => db.products.list(),

  get: (id: string) => db.products.get(id),

  async create(input: NewProduct): Promise<Product> {
    const realCostPerUnit = calcRealCost(
      input.purchasePrice,
      input.quantity,
      input.expenses,
    );
    const product: Product = {
      ...input,
      id: uid("prd"),
      realCostPerUnit,
      initialQuantity: input.quantity,
      createdAt: todayISO(),
      updatedAt: todayISO(),
    };
    await db.products.create(product);
    await logActivity("Mal əlavə etdi", `${product.name} — ${product.quantity} ədəd`);
    return product;
  },

  async update(id: string, input: ProductUpdate): Promise<Product> {
    const realCostPerUnit = calcRealCost(
      input.purchasePrice,
      input.quantity,
      input.expenses,
    );
    return db.products.update(id, {
      ...input,
      realCostPerUnit,
      updatedAt: todayISO(),
    });
  },

  async adjustStock(
    id: string,
    delta: number,
    reason?: string,
  ): Promise<Product> {
    const current = await db.products.get(id);
    if (!current) throw new Error("Mal tapılmadı");
    const quantity = Math.max(0, current.quantity + delta);
    const updated = await db.products.update(id, {
      quantity,
      updatedAt: todayISO(),
    });
    const suffix = reason ? ` (${reason})` : "";
    await logActivity(
      "Stok dəyişdi",
      `${current.name} ${delta > 0 ? "+" : ""}${delta}${suffix}`,
    );
    return updated;
  },
};
