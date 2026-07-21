/** Biznes məntiqli mock əməliyyatlar. */
import { db } from "./db";
import { calcRealCost, mergeExpenseLines } from "@/features/products/lib";
import { uid, todayISO, fmtMoney } from "@/lib/format";
import type { PagedResult } from "@/lib/paging";
import { useAuthStore } from "@/features/auth/store";
import type { CreateSaleInput, SalesListParams, UpdateSaleInput } from "@/features/sales/types";
import type {
  Product,
  Sale,
  SaleDetail,
  PaymentType,
  CustomerPayment,
  Supplier,
  SupplierPayment,
  Expense,
  ExpenseCategory,
  Closing,
  Category,
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

  async remove(id: string): Promise<void> {
    const current = await db.products.get(id);
    if (!current) throw new Error("Mal tapılmadı");
    await db.products.remove(id);
    await logActivity("Mal sildi", current.name);
  },
};

export const categoryHandlers = {
  list: () => db.categories.list(),

  /** Yeni kateqoriya yaradır; ad təkrarlanırsa (registrsiz) xəta atır. */
  async create(name: string): Promise<Category> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Kateqoriya adı boş ola bilməz");
    const existing = await db.categories.list();
    if (existing.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error("Bu kateqoriya artıq mövcuddur");
    }
    const category: Category = { id: uid("cat"), name: trimmed };
    await db.categories.create(category);
    return category;
  },
};

export const saleHandlers = {
  async getById(id: string): Promise<SaleDetail> {
    const sale = await db.sales.get(id);
    if (!sale) throw new Error("Satış tapılmadı");

    let customerName: string | null = null;
    if (sale.customerId) {
      const c = await db.customers.get(sale.customerId);
      customerName = c?.name ?? null;
    }

    let currentProductName: string | null = null;
    if (sale.productId) {
      const p = await db.products.get(sale.productId);
      currentProductName = p?.name ?? null;
    }

    return {
      ...sale,
      expenseItems: sale.expenseItems ?? [],
      customerName,
      currentProductName,
    };
  },

  async list(params: SalesListParams = {}): Promise<PagedResult<Sale>> {
    const take = Math.max(1, params.take ?? 50);
    const skip = Math.max(0, params.skip ?? 0);
    let all = await db.sales.list();

    // Ən yenisi əvvəldə
    all = [...all].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    if (params.from) {
      const from = params.from.slice(0, 10);
      all = all.filter((s) => s.createdAt.slice(0, 10) >= from);
    }
    if (params.to) {
      const to = params.to.slice(0, 10);
      all = all.filter((s) => s.createdAt.slice(0, 10) <= to);
    }
    if (params.paymentType) {
      all = all.filter((s) => s.paymentType === params.paymentType);
    }
    if (params.q?.trim()) {
      const q = params.q.trim().toLowerCase();
      all = all.filter(
        (s) =>
          s.productName.toLowerCase().includes(q) ||
          (s.category ?? "").toLowerCase().includes(q) ||
          (s.soldByName ?? "").toLowerCase().includes(q),
      );
    }
    if (params.minProfit != null) {
      const min = params.minProfit;
      all = all.filter((s) => s.profit != null && s.profit >= min);
    }
    if (params.maxProfit != null) {
      const max = params.maxProfit;
      all = all.filter((s) => s.profit != null && s.profit <= max);
    }
    if (params.minQty != null) {
      all = all.filter((s) => s.quantity >= params.minQty!);
    }
    if (params.maxQty != null) {
      all = all.filter((s) => s.quantity <= params.maxQty!);
    }

    const totalCount = all.length;
    const items = all.slice(skip, skip + take).map((s) => ({
      ...s,
      expenseItems: s.expenseItems ?? [],
    }));
    return { items, totalCount };
  },

  /**
   * Satış biznes zənciri:
   * 1) stok yoxlaması, 2) stok azalır,
   * 3) Nisyədirsə müştəri borcu artır, 4) satış yazılır, 5) activity log.
   *
   * Sərbəst (manual) satış: katalog malı yoxdur — stok yoxlanmır/azalmır,
   * maya bilinmirsə qazanc null ("naməlum") olur.
   */
  async createSale(input: CreateSaleInput): Promise<Sale> {
    const qty = Math.max(1, Math.floor(input.quantity));
    const user = useAuthStore.getState().user;
    const employeeId = user?.id ?? "emp_1";
    const subtotal = input.salePrice * qty;
    const discount = Math.max(0, input.discount);
    const net = Math.max(0, subtotal - discount);
    const isCredit = input.paymentType === "Nisyə";
    const isManual = !!input.isManual || input.productId == null;

    // Katalog malı — sərbəst satışda null
    const product = isManual
      ? null
      : await db.products.get(input.productId as string);
    if (!isManual && !product) throw new Error("Mal tapılmadı");
    if (product && qty > product.quantity) {
      throw new Error("Stokda kifayət qədər mal yoxdur");
    }

    // Maya: katalogda snapshot; manualda bilinirsə dolu, bilinmirsə null
    const costPerUnit = isManual
      ? (input.costPerUnit ?? null)
      : (product?.realCostPerUnit ?? 0);
    const profit = costPerUnit == null ? null : net - costPerUnit * qty;
    const productName = isManual
      ? (input.productName?.trim() || "Sərbəst satış")
      : (product as Product).name;
    const category = isManual
      ? (input.category?.trim() || null)
      : (input.category?.trim() || product?.category || null);
    // Xərc sətirləri yalnız sənədləşmə — maya/qazanc yenidən hesablanmır
    const expenseItems = isManual
      ? mergeExpenseLines(input.expenseItems ?? [])
      : [];

    const sale: Sale = {
      id: uid("sal"),
      productId: product?.id ?? null,
      productName,
      category,
      quantity: qty,
      salePrice: input.salePrice,
      subtotal,
      discount,
      totalAmount: net,
      paymentType: input.paymentType,
      customerId: isCredit ? input.customerId : null,
      costPerUnit,
      profit,
      isManual,
      expenseItems,
      soldByName: user?.name ?? null,
      createdAt: new Date().toISOString(),
      employeeId,
    };

    // 2) Stok azalır (yalnız katalog malında)
    if (product) {
      await db.products.update(product.id, {
        quantity: Math.max(0, product.quantity - qty),
        updatedAt: todayISO(),
      });
    }

    // 3) Nisyə → müştəri borcu yekun (endirimdən sonrakı) məbləğ qədər artır
    if (isCredit && sale.customerId) {
      const c = await db.customers.get(sale.customerId);
      if (c) {
        await db.customers.update(c.id, {
          totalDebt: c.totalDebt + net,
          remainingDebt: c.remainingDebt + net,
          lastPurchaseDate: todayISO(),
        });
      }
    }

    // 4) Satış yazılır
    await db.sales.create(sale);

    // 5) Activity log (endirim varsa ayrıca qeyd)
    await logActivity(
      isCredit ? "Nisyə satış etdi" : "Satış etdi",
      `${productName} × ${qty} — ${fmtMoney(net)}`,
    );
    if (discount > 0) {
      await logActivity(
        "Endirim etdi",
        `${productName} — ${fmtMoney(discount)} endirim`,
      );
    }

    return sale;
  },

  async updateSale(id: string, input: UpdateSaleInput): Promise<Sale> {
    const existing = await db.sales.get(id);
    if (!existing) throw new Error("Satış tapılmadı");

    // Köhnə effektləri geri al
    if (existing.productId && !existing.isManual) {
      const p = await db.products.get(existing.productId);
      if (p) {
        await db.products.update(p.id, {
          quantity: p.quantity + existing.quantity,
          updatedAt: todayISO(),
        });
      }
    }
    if (existing.paymentType === "Nisyə" && existing.customerId) {
      const c = await db.customers.get(existing.customerId);
      if (c) {
        await db.customers.update(c.id, {
          totalDebt: Math.max(0, c.totalDebt - existing.totalAmount),
          remainingDebt: Math.max(0, c.remainingDebt - existing.totalAmount),
        });
      }
    }

    await db.sales.remove(id);
    const updated = await saleHandlers.createSale(input);
    // createSale yeni id verir — köhnə id-ni saxla
    await db.sales.remove(updated.id);
    const kept: Sale = { ...updated, id, createdAt: existing.createdAt };
    await db.sales.create(kept);
    await logActivity("Satış düzəltdi", `${kept.productName} × ${kept.quantity}`);
    return kept;
  },

  async deleteSale(id: string): Promise<void> {
    const existing = await db.sales.get(id);
    if (!existing) throw new Error("Satış tapılmadı");

    if (existing.productId && !existing.isManual) {
      const p = await db.products.get(existing.productId);
      if (p) {
        await db.products.update(p.id, {
          quantity: p.quantity + existing.quantity,
          updatedAt: todayISO(),
        });
      }
    }
    if (existing.paymentType === "Nisyə" && existing.customerId) {
      const c = await db.customers.get(existing.customerId);
      if (c) {
        await db.customers.update(c.id, {
          totalDebt: Math.max(0, c.totalDebt - existing.totalAmount),
          remainingDebt: Math.max(0, c.remainingDebt - existing.totalAmount),
        });
      }
    }

    await db.sales.remove(id);
    await logActivity(
      "Satış sildi",
      `${existing.productName} × ${existing.quantity}`,
    );
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

/** Yeni təchizatçı üçün giriş. */
export interface NewSupplier {
  name: string;
  phone: string;
  note?: string;
}

export const supplierHandlers = {
  /** Təchizatçılar + hər biri üçün bağlı məhsul sayı (itemCount) real hesablanır. */
  async list(): Promise<Supplier[]> {
    const [suppliers, products] = await Promise.all([
      db.suppliers.list(),
      db.products.list(),
    ]);
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.supplierId, (counts.get(p.supplierId) ?? 0) + 1);
    }
    return suppliers.map((s) => ({ ...s, itemCount: counts.get(s.id) ?? 0 }));
  },

  listPayments: async (supplierId: string): Promise<SupplierPayment[]> => {
    const all = await db.supplierPayments.list();
    return all.filter((p) => p.supplierId === supplierId);
  },

  async create(input: NewSupplier): Promise<Supplier> {
    const supplier: Supplier = {
      id: uid("sup"),
      name: input.name.trim(),
      phone: input.phone.trim(),
      note: input.note?.trim() || "",
      totalDebt: 0,
      paidAmount: 0,
      remainingDebt: 0,
      itemCount: 0,
      lastPaymentDate: "",
    };
    await db.suppliers.create(supplier);
    await logActivity("Təchizatçı əlavə etdi", supplier.name);
    return supplier;
  },

  async update(id: string, input: NewSupplier): Promise<Supplier> {
    const s = await db.suppliers.get(id);
    if (!s) throw new Error("Təchizatçı tapılmadı");
    return db.suppliers.update(id, {
      name: input.name.trim(),
      phone: input.phone.trim(),
      note: input.note?.trim() || "",
    });
  },

  async remove(id: string): Promise<void> {
    const s = await db.suppliers.get(id);
    if (!s) throw new Error("Təchizatçı tapılmadı");
    if (s.remainingDebt > 0) {
      throw new Error("Borcu olan təchizatçı silinə bilməz");
    }
    await db.suppliers.remove(id);
    await logActivity("Təchizatçı sildi", s.name);
  },

  /** Mal alışı → mənim təchizatçıya borcum artır. */
  async addDebt(supplierId: string, amount: number): Promise<Supplier> {
    const s = await db.suppliers.get(supplierId);
    if (!s) throw new Error("Təchizatçı tapılmadı");
    const updated = await db.suppliers.update(supplierId, {
      totalDebt: s.totalDebt + amount,
      remainingDebt: s.remainingDebt + amount,
    });
    await logActivity(
      "Təchizatçı borcu artdı",
      `${s.name} — ${fmtMoney(amount)}`,
    );
    return updated;
  },

  /** Təchizatçıya ödəniş → borcum azalır (0-dan aşağı düşmür). */
  async addPayment(
    supplierId: string,
    amount: number,
  ): Promise<SupplierPayment> {
    const s = await db.suppliers.get(supplierId);
    if (!s) throw new Error("Təchizatçı tapılmadı");
    await db.suppliers.update(supplierId, {
      paidAmount: s.paidAmount + amount,
      remainingDebt: Math.max(0, s.remainingDebt - amount),
      lastPaymentDate: todayISO(),
    });
    const payment: SupplierPayment = {
      id: uid("spy"),
      supplierId,
      amount,
      date: todayISO(),
    };
    await db.supplierPayments.create(payment);
    await logActivity(
      "Təchizatçıya ödəniş etdi",
      `${s.name} — ${fmtMoney(amount)}`,
    );
    return payment;
  },
};

/** Yeni xərc üçün giriş. */
export interface NewExpense {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  productId: string | null;
  note?: string;
}

export const expenseHandlers = {
  list: () => db.expenses.list(),

  /**
   * Xərc yazılır. ƏSAS QAYDA: xərc bir mala bağlıdırsa (productId),
   * kateqoriya adı malın expenses massivinə sətir kimi düşür və real maya
   * yenidən hesablanır.
   */
  async createExpense(input: NewExpense): Promise<Expense> {
    const expense: Expense = {
      id: uid("exp"),
      title: input.title.trim(),
      category: input.category,
      amount: input.amount,
      productId: input.productId || null,
      date: input.date,
      note: input.note ?? "",
    };
    await db.expenses.create(expense);

    if (expense.productId) {
      const p = await db.products.get(expense.productId);
      if (p) {
        const expenses = mergeExpenseLines([
          ...(p.expenses ?? []),
          { name: expense.category, amount: expense.amount },
        ]);
        const realCostPerUnit = calcRealCost(
          p.purchasePrice,
          p.initialQuantity,
          expenses,
        );
        await db.products.update(p.id, {
          expenses,
          realCostPerUnit,
          updatedAt: todayISO(),
        });
      }
    }

    await logActivity(
      "Xərc əlavə etdi",
      `${expense.title} — ${fmtMoney(expense.amount)}`,
    );
    return expense;
  },

  async updateExpense(id: string, input: NewExpense): Promise<Expense> {
    const existing = await db.expenses.get(id);
    if (!existing) throw new Error("Xərc tapılmadı");

    // Köhnə mala bağlı xərci geri al
    if (existing.productId) {
      await reverseProductExpense(existing);
    }

    const expense: Expense = {
      ...existing,
      title: input.title.trim(),
      category: input.category,
      amount: input.amount,
      productId: input.productId || null,
      date: input.date,
      note: input.note ?? "",
    };
    await db.expenses.update(id, expense);

    if (expense.productId) {
      await applyProductExpense(expense);
    }

    await logActivity(
      "Xərc düzəltdi",
      `${expense.title} — ${fmtMoney(expense.amount)}`,
    );
    return expense;
  },

  async deleteExpense(id: string): Promise<void> {
    const existing = await db.expenses.get(id);
    if (!existing) throw new Error("Xərc tapılmadı");
    if (existing.productId) {
      await reverseProductExpense(existing);
    }
    await db.expenses.remove(id);
    await logActivity(
      "Xərc sildi",
      `${existing.title} — ${fmtMoney(existing.amount)}`,
    );
  },
};

async function applyProductExpense(expense: Expense): Promise<void> {
  if (!expense.productId) return;
  const p = await db.products.get(expense.productId);
  if (!p) return;
  const expenses = mergeExpenseLines([
    ...(p.expenses ?? []),
    { name: expense.category, amount: expense.amount },
  ]);
  const realCostPerUnit = calcRealCost(
    p.purchasePrice,
    p.initialQuantity,
    expenses,
  );
  await db.products.update(p.id, {
    expenses,
    realCostPerUnit,
    updatedAt: todayISO(),
  });
}

async function reverseProductExpense(expense: Expense): Promise<void> {
  if (!expense.productId) return;
  const p = await db.products.get(expense.productId);
  if (!p) return;
  const idx = (p.expenses ?? []).findIndex(
    (e) => e.name === expense.category && e.amount === expense.amount,
  );
  const expenses = [...(p.expenses ?? [])];
  if (idx >= 0) expenses.splice(idx, 1);
  const realCostPerUnit = calcRealCost(
    p.purchasePrice,
    p.initialQuantity,
    expenses,
  );
  await db.products.update(p.id, {
    expenses,
    realCostPerUnit,
    updatedAt: todayISO(),
  });
}

/** Gün sonu bağlanışı girişi — cəmlər serverdə/mock qatında hesablanır. */
export interface CloseDayInput {
  openingCash: number;
  actualCash: number;
  note?: string;
}

export const closingHandlers = {
  list: () => db.closings.list(),

  /** Bugünkü bağlanış (varsa) — real API-də GET /api/closings/today qarşılığı. */
  async today(): Promise<Closing | null> {
    const t = todayISO();
    const all = await db.closings.list();
    return all.find((c) => c.date === t) ?? null;
  },

  /**
   * Günü bağlayır. Gün cəmləri (nağd/kart/nisyə, xərc) mock db-dən hesablanır —
   * real backend-dəki server-side hesablamanı təqlid edir.
   * Eyni tarix üçün ikinci bağlanışa icazə vermir.
   */
  async closeDay(input: CloseDayInput): Promise<Closing> {
    const t = todayISO();
    const existing = await db.closings.list();
    if (existing.some((c) => c.date === t)) {
      throw new Error("Bu gün artıq bağlanıb");
    }

    const sales = (await db.sales.list()).filter(
      (s) => s.createdAt.slice(0, 10) === t,
    );
    const sumPt = (pt: PaymentType) =>
      sales
        .filter((s) => s.paymentType === pt)
        .reduce((a, s) => a + s.totalAmount, 0);
    const cashSales = sumPt("Nağd");
    const cardSales = sumPt("Kart");
    const creditSales = sumPt("Nisyə");
    const expenses = (await db.expenses.list())
      .filter((e) => e.date.slice(0, 10) === t)
      .reduce((a, e) => a + e.amount, 0);
    const expectedCash = input.openingCash + cashSales - expenses;
    const difference = input.actualCash - expectedCash;

    const closing: Closing = {
      id: uid("cls"),
      date: t,
      openingCash: input.openingCash,
      cashSales,
      cardSales,
      creditSales,
      expenses,
      expectedCash,
      actualCash: input.actualCash,
      difference,
    };
    await db.closings.create(closing);
    await logActivity(
      "Gün sonu bağladı",
      `${t} — fərq: ${fmtMoney(difference)}`,
    );
    return closing;
  },
};
