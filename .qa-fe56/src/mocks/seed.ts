/** Başlanğıc mock data — MVP-dəki realistik verilənlərdən köçürülüb. */
import { uid, todayISO, daysAgoISO, fmtDate, fmtMoney } from "@/lib/format";
import { calcRealCost } from "@/features/products/lib";
import type {
  Product,
  Sale,
  Customer,
  Supplier,
  Employee,
  Expense,
  CustomerPayment,
  SupplierPayment,
  Activity,
  Closing,
  Category,
  ExpenseType,
  PaymentType,
  SalaryEntry,
} from "@/types";

/** Seed strukturu dəyişəndə bu nömrəni artırın → localStorage yenilənir. */
export const SEED_VERSION = 10;

/**
 * BE#15 — qismən ödənişli satış sahələri: seed datasında hər satış tam
 * ödənilmiş/ödənilməmiş sayılır (nümunə datada qismən ödəniş yoxdur) —
 * Nağd/Kart → tam ödənilib, Nisyə → tam qalıq.
 */
const paymentFields = (
  paymentType: PaymentType,
  totalAmount: number,
): Pick<Sale, "paidAmount" | "remainingAmount" | "paidVia"> =>
  paymentType === "Nisyə"
    ? { paidAmount: 0, remainingAmount: totalAmount, paidVia: "Nağd" }
    : { paidAmount: totalAmount, remainingAmount: 0, paidVia: paymentType };

export interface SeedDatabase {
  products: Product[];
  categories: Category[];
  expenseTypes: ExpenseType[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  employees: Employee[];
  closings: Closing[];
  activity: Activity[];
  payments: CustomerPayment[];
  supplierPayments: SupplierPayment[];
  salaryEntries: SalaryEntry[];
}

const buildSuppliers = (): Supplier[] =>
  [
    {
      id: "sup_1",
      name: "İstanbul Tekstil (Laleli)",
      phone: "+994502223344",
      totalDebt: 8400,
      paidAmount: 5400,
      itemCount: 6,
    },
    {
      id: "sup_2",
      name: "Guangzhou Ayaqqabı MMC",
      phone: "+994515556677",
      totalDebt: 12200,
      paidAmount: 9000,
      itemCount: 4,
    },
    {
      id: "sup_3",
      name: "Bakı Toptan Aksesuar",
      phone: "+994703334455",
      totalDebt: 1500,
      paidAmount: 1500,
      itemCount: 3,
    },
    {
      id: "sup_4",
      name: "Merter Cins Toptan",
      phone: "+994554447788",
      totalDebt: 6300,
      paidAmount: 2300,
      itemCount: 2,
    },
  ].map((s) => ({
    ...s,
    remainingDebt: s.totalDebt - s.paidAmount,
    initialDebt: 0,
    lastPaymentDate: daysAgoISO(6),
    createdAt: daysAgoISO(60),
  }));

interface RawProduct {
  name: string;
  category: string;
  size: string;
  color: string;
  model: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  initialQuantity: number;
  minStock: number;
  supplierId: string;
  location: string;
  expenses: Product["expenses"];
  createdAt: string;
}

const rawProducts: RawProduct[] = [
  {
    name: "Kişi cins şalvar Slim",
    category: "Şalvar",
    size: "30-38",
    color: "Tünd göy",
    model: "MNG-armani",
    purchasePrice: 14,
    salePrice: 25,
    quantity: 84,
    initialQuantity: 120,
    minStock: 20,
    supplierId: "sup_4",
    location: "Anbar A / Rəf 3 / Qutu 12",
    expenses: [{ name: "Yol pulu", amount: 240 }, { name: "Fəhlə pulu", amount: 60 }, { name: "Yer/Anbar xərci", amount: 50 }, { name: "Paket/Qutu", amount: 30 }],
    createdAt: daysAgoISO(24),
  },
  {
    name: "Qadın bluz ipək",
    category: "Bluz",
    size: "S-XL",
    color: "Bej",
    model: "Zara style",
    purchasePrice: 8,
    salePrice: 18,
    quantity: 12,
    initialQuantity: 80,
    minStock: 15,
    supplierId: "sup_1",
    location: "Anbar A / Rəf 1 / Qutu 4",
    expenses: [{ name: "Yol pulu", amount: 160 }, { name: "Fəhlə pulu", amount: 40 }, { name: "Yer/Anbar xərci", amount: 30 }, { name: "Paket/Qutu", amount: 20 }],
    createdAt: daysAgoISO(18),
  },
  {
    name: "İdman ayaqqabısı AirMax",
    category: "Ayaqqabı",
    size: "40-45",
    color: "Qara/Ağ",
    model: "N-Air replika",
    purchasePrice: 22,
    salePrice: 45,
    quantity: 46,
    initialQuantity: 60,
    minStock: 10,
    supplierId: "sup_2",
    location: "Anbar B / Rəf 2 / Qutu 7",
    expenses: [{ name: "Yol pulu", amount: 300 }, { name: "Fəhlə pulu", amount: 60 }, { name: "Yer/Anbar xərci", amount: 60 }, { name: "Paket/Qutu", amount: 40 }, { name: "Digər", amount: 20 }],
    createdAt: daysAgoISO(15),
  },
  {
    name: "Uşaq kombinzon qış",
    category: "Uşaq geyimi",
    size: "2-7 yaş",
    color: "Qırmızı",
    model: "WinterKids",
    purchasePrice: 16,
    salePrice: 32,
    quantity: 0,
    initialQuantity: 40,
    minStock: 8,
    supplierId: "sup_1",
    location: "Anbar A / Rəf 5 / Qutu 2",
    expenses: [{ name: "Yol pulu", amount: 120 }, { name: "Fəhlə pulu", amount: 30 }, { name: "Yer/Anbar xərci", amount: 20 }, { name: "Paket/Qutu", amount: 10 }],
    createdAt: daysAgoISO(40),
  },
  {
    name: "Qadın çanta dəri",
    category: "Aksesuar",
    size: "Standart",
    color: "Qəhvəyi",
    model: "LV style",
    purchasePrice: 12,
    salePrice: 28,
    quantity: 34,
    initialQuantity: 50,
    minStock: 10,
    supplierId: "sup_3",
    location: "Mağaza / Vitrin 1",
    expenses: [{ name: "Yol pulu", amount: 90 }, { name: "Fəhlə pulu", amount: 25 }, { name: "Yer/Anbar xərci", amount: 20 }, { name: "Paket/Qutu", amount: 15 }],
    createdAt: daysAgoISO(12),
  },
  {
    name: "Kişi köynək klassik",
    category: "Köynək",
    size: "M-XXL",
    color: "Ağ",
    model: "Classic-FIT",
    purchasePrice: 9,
    salePrice: 17,
    quantity: 95,
    initialQuantity: 100,
    minStock: 20,
    supplierId: "sup_1",
    location: "Anbar A / Rəf 2 / Qutu 9",
    expenses: [{ name: "Yol pulu", amount: 180 }, { name: "Fəhlə pulu", amount: 45 }, { name: "Yer/Anbar xərci", amount: 30 }, { name: "Paket/Qutu", amount: 25 }],
    createdAt: daysAgoISO(65),
  },
  {
    name: "Qış gödəkçəsi kişi",
    category: "Gödəkçə",
    size: "L-XXL",
    color: "Qara",
    model: "NorthStyle",
    purchasePrice: 35,
    salePrice: 33,
    quantity: 28,
    initialQuantity: 35,
    minStock: 6,
    supplierId: "sup_1",
    location: "Anbar B / Rəf 4 / Qutu 1",
    expenses: [{ name: "Yol pulu", amount: 200 }, { name: "Fəhlə pulu", amount: 50 }, { name: "Yer/Anbar xərci", amount: 40 }, { name: "Paket/Qutu", amount: 30 }],
    createdAt: daysAgoISO(70),
  },
  {
    name: "Qadın idman dəsti",
    category: "İdman",
    size: "S-L",
    color: "Çəhrayı",
    model: "FitSet",
    purchasePrice: 13,
    salePrice: 27,
    quantity: 8,
    initialQuantity: 45,
    minStock: 10,
    supplierId: "sup_4",
    location: "Anbar A / Rəf 6 / Qutu 3",
    expenses: [{ name: "Yol pulu", amount: 110 }, { name: "Fəhlə pulu", amount: 30 }, { name: "Yer/Anbar xərci", amount: 25 }, { name: "Paket/Qutu", amount: 15 }],
    createdAt: daysAgoISO(9),
  },
  {
    name: "Uşaq krossovka LED",
    category: "Ayaqqabı",
    size: "25-34",
    color: "Göy",
    model: "KidsLight",
    purchasePrice: 10,
    salePrice: 22,
    quantity: 52,
    initialQuantity: 55,
    minStock: 12,
    supplierId: "sup_2",
    location: "Anbar B / Rəf 1 / Qutu 5",
    expenses: [{ name: "Yol pulu", amount: 140 }, { name: "Fəhlə pulu", amount: 35 }, { name: "Yer/Anbar xərci", amount: 25 }, { name: "Paket/Qutu", amount: 20 }],
    createdAt: daysAgoISO(95),
  },
  {
    name: "Kəmər dəri kişi",
    category: "Aksesuar",
    size: "Universal",
    color: "Qara",
    model: "BeltPro",
    purchasePrice: 4,
    salePrice: 10,
    quantity: 140,
    initialQuantity: 150,
    minStock: 30,
    supplierId: "sup_3",
    location: "Mağaza / Vitrin 2",
    expenses: [{ name: "Yol pulu", amount: 45 }, { name: "Fəhlə pulu", amount: 15 }, { name: "Yer/Anbar xərci", amount: 10 }, { name: "Paket/Qutu", amount: 10 }],
    createdAt: daysAgoISO(35),
  },
];

const parseLocation = (location: string) => {
  const [store = "", shelfPart = "", boxPart = ""] = location.split(" / ");
  return {
    store,
    warehouse: store,
    shelf: shelfPart.replace("Rəf ", ""),
    box: boxPart.replace("Qutu ", ""),
  };
};

const buildProducts = (): Product[] =>
  rawProducts.map((p, i) => {
    // Köhnə düz sahələri dinamik attributes formatına çevir (boş dəyərləri buraxma).
    const { size, color, model, ...rest } = p;
    const attributes = [
      { name: "Ölçü", value: size },
      { name: "Rəng", value: color },
      { name: "Model", value: model },
    ].filter((a) => a.value);
    const realCostPerUnit = calcRealCost(
      p.purchasePrice,
      p.initialQuantity,
      p.expenses,
    );
    const loc = parseLocation(p.location);
    return {
      ...rest,
      attributes,
      id: `prd_${i + 1}`,
      barcode: `SDK${String(1000 + i + 1)}`,
      currency: "AZN",
      image: "",
      note: "",
      realCostPerUnit,
      updatedAt: p.createdAt,
      ...loc,
    };
  });

/** Kateqoriyalar seed-i — mal siyahısındakı distinct kateqoriyalardan. */
const buildCategories = (): Category[] => {
  const names = [...new Set(rawProducts.map((p) => p.category))].filter(Boolean);
  return names.map((name, i) => ({ id: `cat_${i + 1}`, name }));
};

/** Mərkəzi xərc növləri seed-i — köhnə partiya-xərci preset-ləri + ümumi xərc növləri. */
const buildExpenseTypes = (): ExpenseType[] =>
  [
    "Yol pulu",
    "Fəhlə pulu",
    "Yer/Anbar xərci",
    "Paket/Qutu",
    "Gömrük",
    "Mağaza xərci",
    "Digər",
  ].map((name, i) => ({ id: `etp_${i + 1}`, name }));

const buildCustomers = (): Customer[] =>
  [
    {
      id: "cus_1",
      name: "Rəşad Məmmədov (Bina bazar)",
      phone: "994501112233",
      totalDebt: 1240,
      paidAmount: 800,
      lastPurchaseDate: daysAgoISO(2),
      lastPaymentDate: daysAgoISO(5),
    },
    {
      id: "cus_2",
      name: "Aygün Əliyeva",
      phone: "994552223344",
      totalDebt: 380,
      paidAmount: 380,
      lastPurchaseDate: daysAgoISO(11),
      lastPaymentDate: daysAgoISO(3),
    },
    {
      id: "cus_3",
      name: "Elvin Quliyev (8-ci km)",
      phone: "994703334455",
      totalDebt: 2150,
      paidAmount: 900,
      lastPurchaseDate: daysAgoISO(1),
      lastPaymentDate: daysAgoISO(14),
    },
    {
      id: "cus_4",
      name: "Nigar Həsənova",
      phone: "994514445566",
      totalDebt: 560,
      paidAmount: 100,
      lastPurchaseDate: daysAgoISO(28),
      lastPaymentDate: daysAgoISO(28),
    },
  ].map((c) => ({
    ...c,
    remainingDebt: c.totalDebt - c.paidAmount,
    initialDebt: 0,
    // Real dəyər hər siyahı sorğusunda satışlardan hesablanır (customersApi.list);
    // seed-də sıfırla başlayır ki, boş tip qalmasın.
    totalPurchases: 0,
    purchaseCount: 0,
    createdAt: daysAgoISO(60),
  }));

const buildEmployees = (): Employee[] => [
  {
    id: "emp_1",
    name: "Kamran Vəliyev",
    phone: "+994501234567",
    role: "Sahibkar",
    status: "Aktiv",
    monthlySalary: 0,
  },
  {
    id: "emp_2",
    name: "Səbinə Rüstəmova",
    phone: "+994557654321",
    role: "Menecer",
    status: "Aktiv",
    monthlySalary: 900,
  },
  {
    id: "emp_3",
    name: "Tural Abbasov",
    phone: "+994708889900",
    role: "Satıcı",
    status: "Aktiv",
    monthlySalary: 600,
  },
  {
    id: "emp_4",
    name: "Orxan Nəbiyev",
    phone: "+994515550011",
    role: "Satıcı",
    status: "Deaktiv",
    monthlySalary: 0,
  },
];

/**
 * Cari ayın nümunə maaş əməliyyatları (BE#28) — Səbinə üçün avans + tutulma,
 * Tural üçün avans, ki "Maaşlar" görünüşü ilk açılışda boş görünməsin.
 */
const buildSalaryEntries = (): SalaryEntry[] => {
  const month = todayISO().slice(0, 7);
  return [
    {
      id: uid("sal"),
      userId: "emp_2",
      type: "payment",
      amount: 200,
      note: "Avans",
      date: daysAgoISO(5),
      month,
      createdByUserId: "emp_1",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid("sal"),
      userId: "emp_2",
      type: "deduction",
      amount: 15,
      note: "Yemək",
      date: daysAgoISO(3),
      month,
      createdByUserId: "emp_1",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid("sal"),
      userId: "emp_3",
      type: "payment",
      amount: 100,
      note: "",
      date: daysAgoISO(2),
      month,
      createdByUserId: "emp_1",
      createdAt: new Date().toISOString(),
    },
  ];
};

/** Son 30 günün + bugünkü satış tarixçəsi generatoru. */
const buildSales = (
  products: Product[],
  customers: Customer[],
  employees: Employee[],
): Sale[] => {
  const sales: Sale[] = [];
  const picks: [number, number][] = [
    [0, 3],
    [2, 1],
    [5, 4],
    [4, 2],
    [9, 6],
    [1, 2],
    [8, 2],
    [7, 1],
    [2, 2],
    [0, 2],
  ];
  const payCycle: PaymentType[] = ["Nağd", "Kart", "Nağd", "Nisyə", "Nağd", "Kart"];

  for (let d = 29; d >= 1; d--) {
    const n = 1 + ((d * 7) % 3);
    for (let k = 0; k < n; k++) {
      const [pi, q] = picks[(d + k) % picks.length];
      const p = products[pi];
      const pay = payCycle[(d + k) % 6];
      const price = p.salePrice;
      const subtotal = price * q;
      sales.push({
        id: uid("sal"),
        productId: p.id,
        productName: p.name,
        category: p.category || null,
        quantity: q,
        salePrice: price,
        subtotal,
        discount: 0,
        totalAmount: subtotal,
        paymentType: pay,
        ...paymentFields(pay, subtotal),
        customerId: pay === "Nisyə" ? customers[(d + k) % 3].id : null,
        costPerUnit: p.realCostPerUnit,
        purchasePricePerUnit: p.purchasePrice,
        profit: (price - p.realCostPerUnit) * q,
        expenseItems: [],
        createdAt: daysAgoISO(d),
        employeeId: employees[(d + k) % 3].id,
      });
    }
  }

  const today: {
    pi: number;
    q: number;
    pay: PaymentType;
    cus?: string;
    emp: string;
  }[] = [
    { pi: 0, q: 2, pay: "Nağd", emp: "emp_3" },
    { pi: 2, q: 1, pay: "Kart", emp: "emp_2" },
    { pi: 5, q: 3, pay: "Nağd", emp: "emp_3" },
    { pi: 4, q: 1, pay: "Nisyə", cus: "cus_1", emp: "emp_2" },
    { pi: 9, q: 4, pay: "Nağd", emp: "emp_3" },
  ];
  today.forEach(({ pi, q, pay, cus, emp }, i) => {
    const p = products[pi];
    const subtotal = p.salePrice * q;
    // i === 2 → endirimli satış nümunəsi (jurnal cədvəlində sütun yoxdur,
    // endirim yalnız satış detalı drawer-ində > 0 olduqda görünür)
    const discount = i === 2 ? 5 : 0;
    const total = Math.max(0, subtotal - discount);
    const t = new Date();
    t.setHours(9 + i, (i * 17) % 60, 0, 0);
    sales.push({
      id: uid("sal"),
      productId: p.id,
      productName: p.name,
      category: p.category || null,
      quantity: q,
      salePrice: p.salePrice,
      subtotal,
      discount,
      totalAmount: total,
      paymentType: pay,
      ...paymentFields(pay, total),
      customerId: cus || null,
      costPerUnit: p.realCostPerUnit,
      // i === 1 → snapshot xüsusiyyətindən əvvəlki "köhnə" sətir nümunəsi:
      // Maya qiyməti və Xərc "—" göstərilməlidir, Qazanc isə dəyişmir.
      purchasePricePerUnit: i === 1 ? null : p.purchasePrice,
      profit: total - p.realCostPerUnit * q,
      expenseItems: [],
      createdAt: t.toISOString(),
      employeeId: emp,
    });
  });

  // Sərbəst (katalogdankənar) satışlar — biri mayasız (qazanc naməlum), biri maya + xərc ilə
  const manualNoon = new Date();
  manualNoon.setHours(12, 15, 0, 0);
  sales.push({
    id: uid("sal"),
    productId: null,
    productName: "Əl ilə: USB kabel",
    category: "Aksesuar",
    quantity: 1,
    salePrice: 5,
    subtotal: 5,
    discount: 0,
    totalAmount: 5,
    paymentType: "Nağd",
    ...paymentFields("Nağd", 5),
    customerId: null,
    costPerUnit: null,
    purchasePricePerUnit: null,
    profit: null,
    isManual: true,
    expenseItems: [],
    createdAt: manualNoon.toISOString(),
    employeeId: "emp_3",
  });
  const manualAfternoon = new Date();
  manualAfternoon.setHours(14, 40, 0, 0);
  sales.push({
    id: uid("sal"),
    productId: null,
    productName: "Əl ilə: telefon qabı",
    category: "Aksesuar",
    quantity: 2,
    salePrice: 15,
    subtotal: 30,
    discount: 0,
    totalAmount: 30,
    paymentType: "Nağd",
    ...paymentFields("Nağd", 30),
    customerId: null,
    costPerUnit: 8,
    // costPerUnit = purchasePricePerUnit + ΣexpenseItems/say → 5 + 6/2 = 8
    purchasePricePerUnit: 5,
    profit: (15 - 8) * 2,
    isManual: true,
    expenseItems: [
      { name: "Yol pulu", amount: 4 },
      { name: "Paket/Qutu", amount: 2 },
    ],
    createdAt: manualAfternoon.toISOString(),
    employeeId: "emp_2",
  });

  // Sərbəst satış — tam nümunə: alış 100 + xərc 50 (say 2) + satış 150
  // → Maya 100, Xərc 50, Satış 150, Qazanc +50, Yekun 300
  const manualEvening = new Date();
  manualEvening.setHours(16, 5, 0, 0);
  sales.push({
    id: uid("sal"),
    productId: null,
    productName: "Əl ilə: qulaqlıq",
    category: "Aksesuar",
    quantity: 2,
    salePrice: 150,
    subtotal: 300,
    discount: 0,
    totalAmount: 300,
    paymentType: "Kart",
    ...paymentFields("Kart", 300),
    customerId: null,
    costPerUnit: 125,
    purchasePricePerUnit: 100,
    profit: (150 - 125) * 2,
    isManual: true,
    expenseItems: [{ name: "Yol pulu", amount: 50 }],
    createdAt: manualEvening.toISOString(),
    employeeId: "emp_1",
  });

  return sales;
};

const buildExpenses = (): Expense[] => [
  {
    id: uid("exp"),
    title: "Sərnişin yükdaşıma (İstanbul karqo)",
    category: "Yol pulu",
    amount: 240,
    productId: "prd_1",
    date: daysAgoISO(24),
    note: "120 ədəd şalvar partiyası",
    source: "product",
  },
  {
    id: uid("exp"),
    title: "Hambal pulu",
    category: "Fəhlə pulu",
    amount: 45,
    productId: null,
    date: daysAgoISO(4),
    note: "",
    source: "general",
  },
  {
    id: uid("exp"),
    title: "Mağaza icarəsi (aylıq pay)",
    category: "Mağaza xərci",
    amount: 600,
    productId: null,
    date: daysAgoISO(7),
    note: "İyul ayı",
    source: "general",
  },
  {
    id: uid("exp"),
    title: "Sellofan paket 500 əd.",
    category: "Paket/Qutu",
    amount: 35,
    productId: null,
    date: daysAgoISO(3),
    note: "",
    source: "general",
  },
  {
    id: uid("exp"),
    title: "Anbar yeri kirayəsi",
    category: "Yer/Anbar xərci",
    amount: 180,
    productId: null,
    date: daysAgoISO(10),
    note: "Anbar B",
    source: "general",
  },
  {
    id: uid("exp"),
    title: "Çay-su, təsərrüfat",
    category: "Digər",
    amount: 25,
    productId: null,
    date: todayISO(),
    note: "",
    source: "general",
  },
  {
    id: uid("exp"),
    title: "Karqo çatdırılma",
    category: "Yol pulu",
    amount: 60,
    productId: "prd_8",
    date: todayISO(),
    note: "İdman dəsti əlavə partiya",
    source: "product",
  },
];

const buildPayments = (): CustomerPayment[] => [
  { id: uid("pay"), customerId: "cus_1", amount: 300, date: daysAgoISO(5), method: "Nağd" },
  { id: uid("pay"), customerId: "cus_2", amount: 380, date: daysAgoISO(3), method: "Kart" },
  { id: uid("pay"), customerId: "cus_3", amount: 500, date: daysAgoISO(14), method: "Nağd" },
  { id: uid("pay"), customerId: "cus_1", amount: 500, date: daysAgoISO(12), method: "Nağd" },
];

const buildSupplierPayments = (): SupplierPayment[] => [
  { id: uid("spy"), supplierId: "sup_1", amount: 2000, date: daysAgoISO(6) },
  { id: uid("spy"), supplierId: "sup_2", amount: 3000, date: daysAgoISO(9) },
];

const buildActivity = (): Activity[] => [
  {
    id: uid("act"),
    employeeId: "emp_3",
    action: "Satış etdi",
    detail: `Kəmər dəri kişi × 4 — ${fmtMoney(40)}`,
    date: todayISO(),
  },
  {
    id: uid("act"),
    employeeId: "emp_2",
    action: "Nisyə satış etdi",
    detail: "Qadın çanta dəri × 1 — Rəşad Məmmədov",
    date: todayISO(),
  },
  {
    id: uid("act"),
    employeeId: "emp_2",
    action: "Mal əlavə etdi",
    detail: "Qadın idman dəsti — 45 ədəd",
    date: daysAgoISO(9),
  },
  {
    id: uid("act"),
    employeeId: "emp_1",
    action: "Gün sonu bağladı",
    detail: `${fmtDate(daysAgoISO(1))} — fərq: ${fmtMoney(0)}`,
    date: daysAgoISO(1),
  },
  {
    id: uid("act"),
    employeeId: "emp_3",
    action: "Endirim etdi",
    detail: `İdman ayaqqabısı — ${fmtMoney(5)} endirim`,
    date: daysAgoISO(2),
  },
  {
    id: uid("act"),
    employeeId: "emp_2",
    action: "Stok dəyişdi",
    detail: "Kişi köynək klassik +20",
    date: daysAgoISO(6),
  },
];

const buildClosings = (): Closing[] => [
  {
    id: uid("cls"),
    date: daysAgoISO(2),
    openingCash: 350,
    cashSales: 412,
    cardSales: 145,
    creditSales: 90,
    expenses: 80,
    expectedCash: 682,
    actualCash: 680,
    difference: -2,
  },
  {
    id: uid("cls"),
    date: daysAgoISO(1),
    openingCash: 400,
    cashSales: 388,
    cardSales: 210,
    creditSales: 0,
    expenses: 45,
    expectedCash: 743,
    actualCash: 743,
    difference: 0,
  },
];

/** Bütün seed datanı bir obyektdə qaytarır. */
export const buildSeed = (): SeedDatabase => {
  const suppliers = buildSuppliers();
  const products = buildProducts();
  const customers = buildCustomers();
  const employees = buildEmployees();
  const sales = buildSales(products, customers, employees);
  return {
    products,
    categories: buildCategories(),
    expenseTypes: buildExpenseTypes(),
    sales,
    customers,
    suppliers,
    expenses: buildExpenses(),
    employees,
    closings: buildClosings(),
    activity: buildActivity(),
    payments: buildPayments(),
    supplierPayments: buildSupplierPayments(),
    salaryEntries: buildSalaryEntries(),
  };
};
