/** Biznes məntiqli mock əməliyyatlar. */
import { db } from "./db";
import { calcRealCost } from "@/features/products/lib";
import { uid, todayISO, fmtMoney } from "@/lib/format";
import { useAuthStore } from "@/features/auth/store";
import type {
  Product,
  Sale,
  PaymentType,
  CustomerPayment,
} from "@/types";

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

/** Yeni satış üçün giriş. */
export interface CreateSaleInput {
  productId: string;
  quantity: number;
  salePrice: number;
  discount: number;
  paymentType: PaymentType;
  customerId: string | null;
  note?: string;
}

export const saleHandlers = {
  list: () => db.sales.list(),

  /**
   * Satış biznes zənciri:
   * 1) stok yoxlaması, 2) stok azalır,
   * 3) Nisyədirsə müştəri borcu artır, 4) satış yazılır, 5) activity log.
   */
  async createSale(input: CreateSaleInput): Promise<Sale> {
    const product = await db.products.get(input.productId);
    if (!product) throw new Error("Mal tapılmadı");

    const qty = Math.max(1, Math.floor(input.quantity));
    if (qty > product.quantity) {
      throw new Error("Stokda kifayət qədər mal yoxdur");
    }

    const employeeId = useAuthStore.getState().user?.id ?? "emp_1";
    const gross = input.salePrice * qty;
    const discount = Math.max(0, input.discount);
    const net = Math.max(0, gross - discount);
    const profit = net - product.realCostPerUnit * qty;
    const isCredit = input.paymentType === "Nisyə";

    const sale: Sale = {
      id: uid("sal"),
      productId: product.id,
      productName: product.name,
      quantity: qty,
      salePrice: input.salePrice,
      discount,
      paymentType: input.paymentType,
      customerId: isCredit ? input.customerId : null,
      totalAmount: gross,
      costPerUnit: product.realCostPerUnit,
      profit,
      createdAt: todayISO(),
      employeeId,
    };

    // 2) Stok azalır
    await db.products.update(product.id, {
      quantity: Math.max(0, product.quantity - qty),
      updatedAt: todayISO(),
    });

    // 3) Nisyə → müştəri borcu artır
    if (isCredit && sale.customerId) {
      const c = await db.customers.get(sale.customerId);
      if (c) {
        await db.customers.update(c.id, {
          totalDebt: c.totalDebt + gross,
          remainingDebt: c.remainingDebt + gross,
          lastPurchaseDate: todayISO(),
        });
      }
    }

    // 4) Satış yazılır
    await db.sales.create(sale);

    // 5) Activity log (endirim varsa ayrıca qeyd)
    await logActivity(
      isCredit ? "Nisyə satış etdi" : "Satış etdi",
      `${product.name} × ${qty} — ${fmtMoney(gross)}`,
    );
    if (discount > 0) {
      await logActivity(
        "Endirim etdi",
        `${product.name} — ${fmtMoney(discount)} endirim`,
      );
    }

    return sale;
  },

  /** Müştəri ödənişi: borc azalır (0-dan aşağı düşmür) + qeyd + activity. */
  async addCustomerPayment(
    customerId: string,
    amount: number,
    note?: string,
  ): Promise<CustomerPayment> {
    const c = await db.customers.get(customerId);
    if (!c) throw new Error("Müştəri tapılmadı");

    await db.customers.update(customerId, {
      paidAmount: c.paidAmount + amount,
      remainingDebt: Math.max(0, c.remainingDebt - amount),
      lastPaymentDate: todayISO(),
    });

    const payment: CustomerPayment = {
      id: uid("pay"),
      customerId,
      amount,
      date: todayISO(),
      method: "Nağd",
      note,
    };
    await db.payments.create(payment);
    await logActivity(
      "Ödəniş aldı",
      `${c.name} — ${fmtMoney(amount)}${note ? ` (${note})` : ""}`,
    );
    return payment;
  },
};
