import React, {
  useReducer,
  useContext,
  createContext,
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  Lock,
  BarChart3,
  UserCog,
  Settings,
  Search,
  Plus,
  Pencil,
  Minus,
  X,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  HandCoins,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Printer,
  Upload,
  Download,
  LogOut,
  Store,
  ChevronRight,
  Clock,
  Snowflake,
  Banknote,
  CalendarDays,
  Eye,
  Menu,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

/* ============================================================
   src/lib/format.ts  — köməkçi funksiyalar
   ============================================================ */
const fmtMoney = (n, cur = "AZN") =>
  `${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`;
const fmtNum = (n) => (Number(n) || 0).toLocaleString("en-US");
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (d) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};
const fmtDate = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
};
const daysBetween = (iso) => {
  if (!iso) return 999;
  return Math.floor(
    (new Date(todayISO()) - new Date(iso.slice(0, 10))) / 86400000,
  );
};
let _id = 1000;
const uid = (p) => `${p}_${++_id}`;

/* Real maya: (alış məbləği + bütün xərclər) / miqdar */
const calcRealCost = (p) => {
  const exp = p.expenses || {};
  const totalExp = ["yol", "fehle", "yer", "paket", "diger"].reduce(
    (s, k) => s + (Number(exp[k]) || 0),
    0,
  );
  const qty = Number(p.initialQuantity || p.quantity) || 1;
  return (Number(p.purchasePrice) * qty + totalExp) / qty;
};

/* Malın statusu biznes qaydalarına görə hesablanır */
const productStatus = (p, lastSaleDate) => {
  if (p.quantity <= 0) return "Bitib";
  if (p.salePrice < p.realCostPerUnit) return "Ziyana satılır";
  if (p.quantity <= p.minStock) return "Azalır";
  if (daysBetween(lastSaleDate || p.createdAt) >= 30) return "Satılmır";
  return "Stokda var";
};

/* ============================================================
   src/data/mock.ts  — Sədərək üçün realistik mock data
   ============================================================ */
const SUPPLIERS = [
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
  lastPaymentDate: daysAgoISO(6),
}));

const rawProducts = [
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
    expenses: { yol: 240, fehle: 60, yer: 50, paket: 30, diger: 0 },
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
    expenses: { yol: 160, fehle: 40, yer: 30, paket: 20, diger: 0 },
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
    expenses: { yol: 300, fehle: 60, yer: 60, paket: 40, diger: 20 },
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
    expenses: { yol: 120, fehle: 30, yer: 20, paket: 10, diger: 0 },
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
    expenses: { yol: 90, fehle: 25, yer: 20, paket: 15, diger: 0 },
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
    expenses: { yol: 180, fehle: 45, yer: 30, paket: 25, diger: 0 },
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
    expenses: { yol: 200, fehle: 50, yer: 40, paket: 30, diger: 0 },
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
    expenses: { yol: 110, fehle: 30, yer: 25, paket: 15, diger: 0 },
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
    expenses: { yol: 140, fehle: 35, yer: 25, paket: 20, diger: 0 },
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
    expenses: { yol: 45, fehle: 15, yer: 10, paket: 10, diger: 0 },
    createdAt: daysAgoISO(35),
  },
];

const PRODUCTS = rawProducts.map((p, i) => {
  const realCostPerUnit = calcRealCost(p);
  return {
    ...p,
    id: `prd_${i + 1}`,
    currency: "AZN",
    image: "",
    note: "",
    realCostPerUnit,
    updatedAt: p.createdAt,
  };
});

const CUSTOMERS = [
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
].map((c) => ({ ...c, remainingDebt: c.totalDebt - c.paidAmount }));

const EMPLOYEES = [
  {
    id: "emp_1",
    name: "Kamran Vəliyev",
    phone: "+994501234567",
    role: "Sahibkar",
    status: "Aktiv",
  },
  {
    id: "emp_2",
    name: "Səbinə Rüstəmova",
    phone: "+994557654321",
    role: "Menecer",
    status: "Aktiv",
  },
  {
    id: "emp_3",
    name: "Tural Abbasov",
    phone: "+994708889900",
    role: "Satıcı",
    status: "Aktiv",
  },
  {
    id: "emp_4",
    name: "Orxan Nəbiyev",
    phone: "+994515550011",
    role: "Satıcı",
    status: "Deaktiv",
  },
];

/* Satış generatoru — son 30 günün tarixçəsi */
const genSales = () => {
  const sales = [];
  const picks = [
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
  for (let d = 29; d >= 1; d--) {
    const n = 1 + ((d * 7) % 3);
    for (let k = 0; k < n; k++) {
      const [pi, q] = picks[(d + k) % picks.length];
      const p = PRODUCTS[pi];
      const pay = ["Nağd", "Kart", "Nağd", "Nisyə", "Nağd", "Kart"][
        (d + k) % 6
      ];
      const price = p.salePrice;
      sales.push({
        id: uid("sal"),
        productId: p.id,
        productName: p.name,
        quantity: q,
        salePrice: price,
        discount: 0,
        paymentType: pay,
        customerId: pay === "Nisyə" ? CUSTOMERS[(d + k) % 3].id : null,
        totalAmount: price * q,
        profit: (price - p.realCostPerUnit) * q,
        createdAt: daysAgoISO(d),
        employeeId: EMPLOYEES[(d + k) % 3].id,
      });
    }
  }
  /* Bugünkü satışlar */
  const today = [
    { pi: 0, q: 2, pay: "Nağd", emp: "emp_3" },
    { pi: 2, q: 1, pay: "Kart", emp: "emp_2" },
    { pi: 5, q: 3, pay: "Nağd", emp: "emp_3" },
    { pi: 4, q: 1, pay: "Nisyə", cus: "cus_1", emp: "emp_2" },
    { pi: 9, q: 4, pay: "Nağd", emp: "emp_3" },
  ];
  today.forEach(({ pi, q, pay, cus, emp }) => {
    const p = PRODUCTS[pi];
    sales.push({
      id: uid("sal"),
      productId: p.id,
      productName: p.name,
      quantity: q,
      salePrice: p.salePrice,
      discount: 0,
      paymentType: pay,
      customerId: cus || null,
      totalAmount: p.salePrice * q,
      profit: (p.salePrice - p.realCostPerUnit) * q,
      createdAt: todayISO(),
      employeeId: emp,
    });
  });
  return sales;
};

const EXPENSES = [
  {
    id: uid("exp"),
    title: "Sərnişin yükdaşıma (İstanbul karqo)",
    category: "Yol",
    amount: 240,
    productId: "prd_1",
    date: daysAgoISO(24),
    note: "120 ədəd şalvar partiyası",
  },
  {
    id: uid("exp"),
    title: "Hambal pulu",
    category: "Fəhlə",
    amount: 45,
    productId: null,
    date: daysAgoISO(4),
    note: "",
  },
  {
    id: uid("exp"),
    title: "Mağaza icarəsi (aylıq pay)",
    category: "Mağaza",
    amount: 600,
    productId: null,
    date: daysAgoISO(7),
    note: "İyul ayı",
  },
  {
    id: uid("exp"),
    title: "Sellofan paket 500 əd.",
    category: "Paket/Qutu",
    amount: 35,
    productId: null,
    date: daysAgoISO(3),
    note: "",
  },
  {
    id: uid("exp"),
    title: "Anbar yeri kirayəsi",
    category: "Anbar/Yer",
    amount: 180,
    productId: null,
    date: daysAgoISO(10),
    note: "Anbar B",
  },
  {
    id: uid("exp"),
    title: "Çay-su, təsərrüfat",
    category: "Digər",
    amount: 25,
    productId: null,
    date: todayISO(),
    note: "",
  },
  {
    id: uid("exp"),
    title: "Karqo çatdırılma",
    category: "Yol",
    amount: 60,
    productId: "prd_8",
    date: todayISO(),
    note: "İdman dəsti əlavə partiya",
  },
];

const CUSTOMER_PAYMENTS = [
  {
    id: uid("pay"),
    customerId: "cus_1",
    amount: 300,
    date: daysAgoISO(5),
    method: "Nağd",
  },
  {
    id: uid("pay"),
    customerId: "cus_2",
    amount: 380,
    date: daysAgoISO(3),
    method: "Kart",
  },
  {
    id: uid("pay"),
    customerId: "cus_3",
    amount: 500,
    date: daysAgoISO(14),
    method: "Nağd",
  },
  {
    id: uid("pay"),
    customerId: "cus_1",
    amount: 500,
    date: daysAgoISO(12),
    method: "Nağd",
  },
];

const SUPPLIER_PAYMENTS = [
  { id: uid("spy"), supplierId: "sup_1", amount: 2000, date: daysAgoISO(6) },
  { id: uid("spy"), supplierId: "sup_2", amount: 3000, date: daysAgoISO(9) },
];

const ACTIVITY = [
  {
    id: uid("act"),
    employeeId: "emp_3",
    action: "Satış etdi",
    detail: "Kəmər dəri kişi × 4 — 40.00 AZN",
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
    detail: `${fmtDate(daysAgoISO(1))} — fərq: 0.00 AZN`,
    date: daysAgoISO(1),
  },
  {
    id: uid("act"),
    employeeId: "emp_3",
    action: "Endirim etdi",
    detail: "İdman ayaqqabısı — 5 AZN endirim",
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

const CLOSINGS = [
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

/* ============================================================
   src/store/index.tsx  — Context + Reducer (Zustand əvəzi)
   ============================================================ */
const initialState = {
  auth: { loggedIn: false, user: null },
  settings: {
    storeName: "Kamran Tekstil",
    ownerName: "Kamran Vəliyev",
    whatsapp: "+994501234567",
    currency: "AZN",
    defaultMinStock: 10,
    language: "Azərbaycan dili",
    profitMode: "Real maya ilə (alış + xərclər)",
    openingCash: 400,
  },
  products: PRODUCTS,
  sales: genSales(),
  customers: CUSTOMERS,
  suppliers: SUPPLIERS,
  customerPayments: CUSTOMER_PAYMENTS,
  supplierPayments: SUPPLIER_PAYMENTS,
  expenses: EXPENSES,
  employees: EMPLOYEES,
  activity: ACTIVITY,
  closings: CLOSINGS,
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      return { ...state, auth: { loggedIn: true, user: action.user } };
    case "LOGOUT":
      return { ...state, auth: { loggedIn: false, user: null } };
    case "TOAST": {
      const t = { id: uid("tst"), ...action.toast };
      return { ...state, toasts: [...state.toasts, t] };
    }
    case "DISMISS_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.id),
      };

    case "ADD_PRODUCT": {
      const p = action.product;
      const realCostPerUnit = calcRealCost(p);
      const prod = {
        ...p,
        id: uid("prd"),
        realCostPerUnit,
        initialQuantity: p.quantity,
        createdAt: todayISO(),
        updatedAt: todayISO(),
      };
      const act = {
        id: uid("act"),
        employeeId: state.auth.user?.id || "emp_1",
        action: "Mal əlavə etdi",
        detail: `${p.name} — ${p.quantity} ədəd`,
        date: todayISO(),
      };
      return {
        ...state,
        products: [prod, ...state.products],
        activity: [act, ...state.activity],
      };
    }
    case "UPDATE_PRODUCT": {
      const p = action.product;
      const realCostPerUnit = calcRealCost(p);
      return {
        ...state,
        products: state.products.map((x) =>
          x.id === p.id
            ? { ...x, ...p, realCostPerUnit, updatedAt: todayISO() }
            : x,
        ),
      };
    }
    case "ADJUST_STOCK": {
      const { productId, delta } = action;
      const act = {
        id: uid("act"),
        employeeId: state.auth.user?.id || "emp_1",
        action: "Stok dəyişdi",
        detail: `${state.products.find((p) => p.id === productId)?.name} ${delta > 0 ? "+" : ""}${delta}`,
        date: todayISO(),
      };
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === productId
            ? {
                ...p,
                quantity: Math.max(0, p.quantity + delta),
                updatedAt: todayISO(),
              }
            : p,
        ),
        activity: [act, ...state.activity],
      };
    }
    case "ADD_SALE": {
      /* Qayda 1: stok azalır. Qayda 2: nisyə → müştəri borcu artır. */
      const s = action.sale;
      const product = state.products.find((p) => p.id === s.productId);
      const sale = { ...s, id: uid("sal"), createdAt: todayISO() };
      let customers = state.customers;
      if (s.paymentType === "Nisyə" && s.customerId) {
        customers = customers.map((c) =>
          c.id === s.customerId
            ? {
                ...c,
                totalDebt: c.totalDebt + s.totalAmount,
                remainingDebt: c.remainingDebt + s.totalAmount,
                lastPurchaseDate: todayISO(),
              }
            : c,
        );
      }
      const act = {
        id: uid("act"),
        employeeId: s.employeeId,
        action: s.paymentType === "Nisyə" ? "Nisyə satış etdi" : "Satış etdi",
        detail: `${product?.name} × ${s.quantity} — ${fmtMoney(s.totalAmount)}`,
        date: todayISO(),
      };
      const acts = [act, ...state.activity];
      if (s.discount > 0)
        acts.unshift({
          id: uid("act"),
          employeeId: s.employeeId,
          action: "Endirim etdi",
          detail: `${product?.name} — ${fmtMoney(s.discount)} endirim`,
          date: todayISO(),
        });
      return {
        ...state,
        sales: [...state.sales, sale],
        products: state.products.map((p) =>
          p.id === s.productId
            ? { ...p, quantity: Math.max(0, p.quantity - s.quantity) }
            : p,
        ),
        customers,
        activity: acts,
      };
    }
    case "ADD_CUSTOMER": {
      const c = {
        ...action.customer,
        id: uid("cus"),
        totalDebt: 0,
        paidAmount: 0,
        remainingDebt: 0,
        lastPurchaseDate: null,
        lastPaymentDate: null,
      };
      return { ...state, customers: [c, ...state.customers] };
    }
    case "ADD_CUSTOMER_PAYMENT": {
      /* Qayda 3: ödəniş → borc azalır */
      const { customerId, amount, method } = action;
      const pay = {
        id: uid("pay"),
        customerId,
        amount,
        method,
        date: todayISO(),
      };
      return {
        ...state,
        customerPayments: [pay, ...state.customerPayments],
        customers: state.customers.map((c) =>
          c.id === customerId
            ? {
                ...c,
                paidAmount: c.paidAmount + amount,
                remainingDebt: Math.max(0, c.remainingDebt - amount),
                lastPaymentDate: todayISO(),
              }
            : c,
        ),
      };
    }
    case "ADD_SUPPLIER": {
      const s = {
        ...action.supplier,
        id: uid("sup"),
        totalDebt: 0,
        paidAmount: 0,
        remainingDebt: 0,
        itemCount: 0,
        lastPaymentDate: null,
      };
      return { ...state, suppliers: [s, ...state.suppliers] };
    }
    case "ADD_SUPPLIER_DEBT": {
      const { supplierId, amount } = action;
      return {
        ...state,
        suppliers: state.suppliers.map((s) =>
          s.id === supplierId
            ? {
                ...s,
                totalDebt: s.totalDebt + amount,
                remainingDebt: s.remainingDebt + amount,
              }
            : s,
        ),
      };
    }
    case "ADD_SUPPLIER_PAYMENT": {
      const { supplierId, amount } = action;
      const pay = { id: uid("spy"), supplierId, amount, date: todayISO() };
      return {
        ...state,
        supplierPayments: [pay, ...state.supplierPayments],
        suppliers: state.suppliers.map((s) =>
          s.id === supplierId
            ? {
                ...s,
                paidAmount: s.paidAmount + amount,
                remainingDebt: Math.max(0, s.remainingDebt - amount),
                lastPaymentDate: todayISO(),
              }
            : s,
        ),
      };
    }
    case "ADD_EXPENSE": {
      /* Qayda 5: mala bağlı xərc real mayaya təsir edir */
      const e = { ...action.expense, id: uid("exp") };
      let products = state.products;
      if (e.productId) {
        products = products.map((p) => {
          if (p.id !== e.productId) return p;
          const exps = {
            ...p.expenses,
            diger: (Number(p.expenses?.diger) || 0) + e.amount,
          };
          const np = { ...p, expenses: exps };
          return { ...np, realCostPerUnit: calcRealCost(np) };
        });
      }
      return { ...state, expenses: [e, ...state.expenses], products };
    }
    case "CLOSE_DAY": {
      const c = { ...action.closing, id: uid("cls") };
      const act = {
        id: uid("act"),
        employeeId: state.auth.user?.id || "emp_1",
        action: "Gün sonu bağladı",
        detail: `${fmtDate(c.date)} — fərq: ${fmtMoney(c.difference)}`,
        date: todayISO(),
      };
      return {
        ...state,
        closings: [...state.closings, c],
        activity: [act, ...state.activity],
      };
    }
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.settings } };
    default:
      return state;
  }
}

const StoreCtx = createContext(null);
const useStore = () => useContext(StoreCtx);

/* Törəmə (derived) hesablamalar — bir yerdə */
const useDerived = () => {
  const { state } = useStore();
  return useMemo(() => {
    const t = todayISO();
    const todaySales = state.sales.filter((s) => s.createdAt === t);
    const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);
    const todayTotal = sum(todaySales, (s) => s.totalAmount - s.discount);
    const todayProfit = sum(todaySales, (s) => s.profit);
    const todayCash = sum(
      todaySales.filter((s) => s.paymentType === "Nağd"),
      (s) => s.totalAmount - s.discount,
    );
    const todayCard = sum(
      todaySales.filter((s) => s.paymentType === "Kart"),
      (s) => s.totalAmount - s.discount,
    );
    const todayCredit = sum(
      todaySales.filter((s) => s.paymentType === "Nisyə"),
      (s) => s.totalAmount - s.discount,
    );
    const todayExpenses = sum(
      state.expenses.filter((e) => e.date === t),
      (e) => e.amount,
    );
    const stockValue = sum(
      state.products,
      (p) => p.realCostPerUnit * p.quantity,
    );
    const receivables = sum(state.customers, (c) => c.remainingDebt);
    const payables = sum(state.suppliers, (s) => s.remainingDebt);
    const expectedCash = state.settings.openingCash + todayCash - todayExpenses;

    const lastSaleByProduct = {};
    state.sales.forEach((s) => {
      if (
        !lastSaleByProduct[s.productId] ||
        s.createdAt > lastSaleByProduct[s.productId]
      )
        lastSaleByProduct[s.productId] = s.createdAt;
    });
    const withStatus = state.products.map((p) => ({
      ...p,
      status: productStatus(p, lastSaleByProduct[p.id]),
      lastSaleDate: lastSaleByProduct[p.id] || null,
    }));
    const lowStock = withStatus.filter(
      (p) => p.status === "Azalır" || p.status === "Bitib",
    );
    const frozen = withStatus
      .map((p) => ({
        ...p,
        idleDays: daysBetween(lastSaleByProduct[p.id] || p.createdAt),
      }))
      .filter((p) => p.idleDays >= 30 && p.quantity > 0);

    /* Son 7 gün satış chartı */
    const daily = [];
    for (let d = 6; d >= 0; d--) {
      const iso = daysAgoISO(d);
      const ds = state.sales.filter((s) => s.createdAt === iso);
      daily.push({
        date: fmtDate(iso).slice(0, 5),
        satis: sum(ds, (s) => s.totalAmount - s.discount),
        qazanc: Math.round(sum(ds, (s) => s.profit) * 100) / 100,
      });
    }
    /* Son 30 gün → 4 həftəlik qazanc */
    const monthly = [0, 1, 2, 3]
      .map((w) => {
        const from = daysAgoISO((w + 1) * 7 - 1),
          to = daysAgoISO(w * 7);
        const ws = state.sales.filter(
          (s) => s.createdAt >= from && s.createdAt <= to,
        );
        return {
          week: `Həftə ${4 - w}`,
          qazanc: Math.round(sum(ws, (s) => s.profit)),
        };
      })
      .reverse();

    /* Ən çox satılanlar */
    const salesByProduct = {};
    state.sales.forEach((s) => {
      salesByProduct[s.productId] =
        (salesByProduct[s.productId] || 0) + s.quantity;
    });
    const topProducts = Object.entries(salesByProduct)
      .map(([pid, qty]) => ({
        product: withStatus.find((p) => p.id === pid),
        qty,
      }))
      .filter((x) => x.product)
      .sort((a, b) => b.qty - a.qty);

    const expByCat = {};
    state.expenses.forEach((e) => {
      expByCat[e.category] = (expByCat[e.category] || 0) + e.amount;
    });

    return {
      todaySales,
      todayTotal,
      todayProfit,
      todayCash,
      todayCard,
      todayCredit,
      todayExpenses,
      stockValue,
      receivables,
      payables,
      expectedCash,
      withStatus,
      lowStock,
      frozen,
      daily,
      monthly,
      topProducts,
      expByCat,
    };
  }, [state]);
};

/* ============================================================
   src/components/ui/*  — təkrar istifadə olunan UI primitivləri
   ============================================================ */
const STATUS_STYLE = {
  "Stokda var": "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Azalır: "bg-amber-100 text-amber-800 ring-amber-200",
  Bitib: "bg-red-100 text-red-700 ring-red-200",
  Satılmır: "bg-sky-100 text-sky-800 ring-sky-200",
  "Ziyana satılır": "bg-rose-100 text-rose-800 ring-rose-200",
  Aktiv: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Deaktiv: "bg-stone-200 text-stone-600 ring-stone-300",
  Nağd: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Kart: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  Nisyə: "bg-amber-100 text-amber-800 ring-amber-200",
  Borclu: "bg-red-100 text-red-700 ring-red-200",
  Ödənilib: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};
const Badge = ({ children, tone }) => (
  <span
    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${STATUS_STYLE[tone || children] || "bg-stone-100 text-stone-700 ring-stone-200"}`}
  >
    {children}
  </span>
);

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}) => {
  const v = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm",
    secondary:
      "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-stone-600 hover:bg-stone-100",
    warn: "bg-amber-500 text-white hover:bg-amber-600",
  }[variant];
  const s = {
    md: "px-3.5 py-2 text-sm",
    sm: "px-2.5 py-1.5 text-xs",
    lg: "px-5 py-2.5 text-base",
  }[size];
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v} ${s} ${className}`}
    >
      {children}
    </button>
  );
};

const Field = ({ label, children, hint, required }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
      {label}
      {required && <span className="text-red-500"> *</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
  </label>
);
const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const Input = (props) => (
  <input {...props} className={`${inputCls} ${props.className || ""}`} />
);
const Select = ({ children, ...props }) => (
  <select {...props} className={`${inputCls} ${props.className || ""}`}>
    {children}
  </select>
);
const Textarea = (props) => (
  <textarea
    rows={2}
    {...props}
    className={`${inputCls} ${props.className || ""}`}
  />
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} />
      <div
        className={`relative max-h-[90vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-2xl bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const Drawer = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-3.5">
          <h3 className="text-base font-bold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiq et",
  danger,
}) => (
  <Modal open={open} onClose={onClose} title={title}>
    <p className="text-sm text-stone-600">{message}</p>
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="secondary" onClick={onClose}>
        İmtina
      </Button>
      <Button
        variant={danger ? "danger" : "primary"}
        onClick={() => {
          onConfirm();
          onClose();
        }}
      >
        {confirmText}
      </Button>
    </div>
  </Modal>
);

const EmptyState = ({ icon: Icon = Package, title, hint, action }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
    <div className="mb-3 rounded-full bg-stone-200 p-3 text-stone-500">
      <Icon size={22} />
    </div>
    <p className="text-sm font-semibold text-stone-700">{title}</p>
    {hint && <p className="mt-1 max-w-xs text-xs text-stone-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const Toasts = () => {
  const { state, dispatch } = useStore();
  useEffect(() => {
    if (!state.toasts.length) return;
    const t = setTimeout(
      () => dispatch({ type: "DISMISS_TOAST", id: state.toasts[0].id }),
      3500,
    );
    return () => clearTimeout(t);
  }, [state.toasts, dispatch]);
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${t.kind === "error" ? "bg-red-600" : t.kind === "warn" ? "bg-amber-500" : "bg-emerald-700"}`}
        >
          {t.kind === "error" ? (
            <AlertTriangle size={16} />
          ) : (
            <Check size={16} />
          )}
          {t.msg}
          <button
            onClick={() => dispatch({ type: "DISMISS_TOAST", id: t.id })}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, icon: Icon, tone = "default" }) => {
  const tones = {
    default: "text-stone-900",
    green: "text-emerald-700",
    red: "text-red-600",
    amber: "text-amber-600",
    indigo: "text-indigo-600",
  };
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          {label}
        </span>
        {Icon && <Icon size={16} className="text-stone-400" />}
      </div>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${tones[tone]}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
};

const Card = ({ title, action, children, className = "" }) => (
  <div
    className={`rounded-xl border border-stone-200 bg-white shadow-sm ${className}`}
  >
    {(title || action) && (
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h3 className="text-sm font-bold text-stone-800">{title}</h3>
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Th = ({ children, right }) => (
  <th
    className={`whitespace-nowrap px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-stone-500 ${right ? "text-right" : "text-left"}`}
  >
    {children}
  </th>
);
const Td = ({ children, right, className = "" }) => (
  <td
    className={`whitespace-nowrap px-3 py-2.5 text-sm text-stone-700 ${right ? "text-right tabular-nums" : ""} ${className}`}
  >
    {children}
  </td>
);
const TableWrap = ({ children }) => (
  <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-stone-200">{children}</table>
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-stone-200 border-t-emerald-600" />
  </div>
);

/* Səhifə başlığı */
const PageHead = ({ title, sub, actions }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-xl font-bold text-stone-900">{title}</h1>
      {sub && <p className="mt-0.5 text-sm text-stone-500">{sub}</p>}
    </div>
    <div className="flex flex-wrap gap-2">{actions}</div>
  </div>
);

/* ============================================================
   src/pages/Login.tsx
   ============================================================ */
const LoginPage = () => {
  const { dispatch } = useStore();
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!login.trim() || !pass.trim()) {
      setErr("Telefon/email və şifrəni daxil edin.");
      return;
    }
    setErr("");
    setLoading(true);
    setTimeout(() => {
      dispatch({ type: "LOGIN", user: EMPLOYEES[0] });
      dispatch({ type: "TOAST", toast: { msg: "Xoş gəldiniz, Kamran!" } });
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
            <Store size={26} className="text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sədərək Sistem</h1>
          <p className="mt-1 text-sm text-emerald-200/80">
            Sədərək üçün sadə anbar, borc və real qazanc sistemi
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <div className="space-y-4">
            <Field label="Telefon və ya email" required>
              <Input
                placeholder="+994 50 123 45 67"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </Field>
            <Field label="Şifrə" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </Field>
            {err && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
                <AlertTriangle size={13} />
                {err}
              </p>
            )}
            <Button
              className="w-full justify-center"
              size="lg"
              onClick={submit}
              disabled={loading}
            >
              {loading ? "Yoxlanılır..." : "Daxil ol"}
            </Button>
            <p className="text-center text-xs text-stone-400">
              Demo: istənilən məlumatla daxil olun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   src/layout/  — Sidebar + Topbar
   ============================================================ */
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Mallar", icon: Package },
  { key: "sales", label: "Satış", icon: ShoppingCart },
  { key: "customers", label: "Nisyə Borclar", icon: Users },
  { key: "suppliers", label: "Təchizatçılar", icon: Truck },
  { key: "expenses", label: "Xərclər", icon: Receipt },
  { key: "dayend", label: "Gün Sonu", icon: Lock },
  { key: "reports", label: "Hesabatlar", icon: BarChart3 },
  { key: "employees", label: "İşçilər", icon: UserCog },
  { key: "settings", label: "Ayarlar", icon: Settings },
];

const Sidebar = ({ page, setPage, mobileOpen, setMobileOpen }) => {
  const { state } = useStore();
  const d = useDerived();
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-stone-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-emerald-950 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/40">
            <Store size={18} className="text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">
              Sədərək Sistem
            </p>
            <p className="text-[11px] text-emerald-300/70 leading-tight">
              {state.settings.storeName}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = page === key;
            const badge =
              key === "products" && d.lowStock.length > 0
                ? d.lowStock.length
                : null;
            return (
              <button
                key={key}
                onClick={() => {
                  setPage(key);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? "bg-emerald-700 text-white" : "text-emerald-100/70 hover:bg-emerald-900 hover:text-white"}`}
              >
                <Icon size={17} />
                <span className="flex-1 text-left">{label}</span>
                {badge && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-emerald-900 px-4 py-3">
          <p className="text-[11px] text-emerald-300/60">Kassada olmalı</p>
          <p className="text-lg font-bold tabular-nums text-emerald-300">
            {fmtMoney(d.expectedCash)}
          </p>
        </div>
      </aside>
    </>
  );
};

const Topbar = ({ setMobileOpen, onSearch, search }) => {
  const { state, dispatch } = useStore();
  const now = new Date();
  const dateStr = now.toLocaleDateString("az-AZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white/90 px-4 py-2.5 backdrop-blur">
      <button
        className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={18} />
      </button>
      <div className="hidden sm:block">
        <p className="text-sm font-bold text-stone-900">
          {state.settings.storeName}
        </p>
        <p className="flex items-center gap-1 text-xs text-stone-500">
          <CalendarDays size={12} />
          {dateStr}
        </p>
      </div>
      <div className="relative ml-auto w-full max-w-xs">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Mal axtar..."
          className="w-full rounded-full border border-stone-200 bg-stone-100 py-1.5 pl-9 pr-3 text-sm focus:border-emerald-600 focus:bg-white focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-bold text-stone-800">
            {state.auth.user?.name}
          </p>
          <p className="text-[11px] text-stone-500">{state.auth.user?.role}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
          {state.auth.user?.name?.[0]}
        </div>
        <button
          onClick={() => dispatch({ type: "LOGOUT" })}
          title="Çıxış"
          className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-red-600"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};

/* ============================================================
   src/pages/Dashboard.tsx
   ============================================================ */
const DashboardPage = ({ setPage }) => {
  const { state } = useStore();
  const d = useDerived();
  const empName = (id) => state.employees.find((e) => e.id === id)?.name || "—";
  const cusName = (id) => state.customers.find((c) => c.id === id)?.name || "—";
  const recentSales = [...state.sales].reverse().slice(0, 6);
  const recentPayments = [...state.customerPayments].slice(0, 5);

  return (
    <div>
      <PageHead title="Dashboard" sub="Bugünkü vəziyyət bir baxışda" />

      {/* İMZA ELEMENTİ — Qayda 9: real nağd pul vs kağız üzərində qazanc */}
      <div className="mb-5 grid gap-3 rounded-2xl bg-emerald-950 p-4 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-900/60 p-4 ring-1 ring-emerald-700/50">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Banknote size={14} /> Real pul (kassada olmalı)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {fmtMoney(d.expectedCash)}
          </p>
          <p className="mt-1 text-xs text-emerald-200/70">
            Başlanğıc {fmtMoney(state.settings.openingCash)} + nağd satış{" "}
            {fmtMoney(d.todayCash)} − xərc {fmtMoney(d.todayExpenses)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-900/60 p-4 ring-1 ring-emerald-700/50">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
            <TrendingUp size={14} /> Kağız üzərində qazanc (bu gün)
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {fmtMoney(d.todayProfit)}
          </p>
          <p className="mt-1 text-xs text-emerald-200/70">
            Bunun {fmtMoney(d.todayCredit)} hissəsi nisyədədir — hələ əlinizdə
            deyil
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Bugünkü satış"
          value={fmtMoney(d.todayTotal)}
          icon={ShoppingCart}
        />
        <StatCard
          label="Bugünkü xalis qazanc"
          value={fmtMoney(d.todayProfit)}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Bugünkü xərc"
          value={fmtMoney(d.todayExpenses)}
          icon={Receipt}
          tone="red"
        />
        <StatCard
          label="Nağd satış"
          value={fmtMoney(d.todayCash)}
          icon={Wallet}
        />
        <StatCard
          label="Kart satış"
          value={fmtMoney(d.todayCard)}
          icon={CreditCard}
          tone="indigo"
        />
        <StatCard
          label="Nisyə satış"
          value={fmtMoney(d.todayCredit)}
          icon={HandCoins}
          tone="amber"
        />
        <StatCard
          label="Anbar dəyəri"
          value={fmtMoney(d.stockValue)}
          sub="real maya ilə"
          icon={Package}
        />
        <StatCard
          label="Mənə borclular"
          value={fmtMoney(d.receivables)}
          icon={Users}
          tone="green"
        />
        <StatCard
          label="Mənim borclarım"
          value={fmtMoney(d.payables)}
          icon={Truck}
          tone="red"
        />
        <StatCard
          label="Kassada olmalı"
          value={fmtMoney(d.expectedCash)}
          icon={Banknote}
          tone="green"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış (son 7 gün)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v) => fmtMoney(v)} />
              <Bar
                dataKey="satis"
                name="Satış"
                fill="#047857"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Həftəlik qazanc (son 30 gün)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={d.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v) => fmtMoney(v)} />
              <Line
                type="monotone"
                dataKey="qazanc"
                name="Qazanc"
                stroke="#b45309"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card
          title="Ən çox satılan mallar"
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage("reports")}
            >
              Hamısı <ChevronRight size={13} />
            </Button>
          }
        >
          <div className="space-y-2.5">
            {d.topProducts.slice(0, 5).map(({ product, qty }, i) => (
              <div key={product.id} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-xs font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm text-stone-700">
                  {product.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-stone-900">
                  {qty} əd.
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title={`Azalan stok (${d.lowStock.length})`}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage("products")}
            >
              Mallara keç <ChevronRight size={13} />
            </Button>
          }
        >
          {d.lowStock.length === 0 ? (
            <EmptyState
              icon={Check}
              title="Stok problemi yoxdur"
              hint="Bütün mallar minimum stokdan yuxarıdır."
            />
          ) : (
            <div className="space-y-2.5">
              {d.lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <AlertTriangle
                    size={15}
                    className={
                      p.status === "Bitib" ? "text-red-500" : "text-amber-500"
                    }
                  />
                  <span className="flex-1 truncate text-sm text-stone-700">
                    {p.name}
                  </span>
                  <Badge tone={p.status}>{p.quantity} əd.</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Satılmayan mallar (pul dondurur)">
          {d.frozen.length === 0 ? (
            <EmptyState icon={Snowflake} title="Donmuş mal yoxdur" />
          ) : (
            <div className="space-y-2.5">
              {d.frozen.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <Snowflake size={15} className="text-sky-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-stone-700">{p.name}</p>
                    <p className="text-[11px] text-stone-400">
                      {p.idleDays >= 90
                        ? "90+"
                        : p.idleDays >= 60
                          ? "60+"
                          : "30+"}{" "}
                      gündür satılmır
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-sky-700">
                    {fmtMoney(p.realCostPerUnit * p.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Son satışlar">
          <div className="divide-y divide-stone-100">
            {recentSales.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {s.productName} × {s.quantity}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {fmtDate(s.createdAt)} · {empName(s.employeeId)}
                  </p>
                </div>
                <Badge tone={s.paymentType}>{s.paymentType}</Badge>
                <span className="w-24 text-right text-sm font-bold tabular-nums text-stone-900">
                  {fmtMoney(s.totalAmount - s.discount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Son ödənişlər (nisyə)">
          {recentPayments.length === 0 ? (
            <EmptyState icon={HandCoins} title="Ödəniş yoxdur" />
          ) : (
            <div className="divide-y divide-stone-100">
              {recentPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {cusName(p.customerId)}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      {fmtDate(p.date)} · {p.method}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-emerald-700">
                    +{fmtMoney(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ============================================================
   src/pages/Products.tsx  — Mallar / Anbar
   ============================================================ */
const emptyProduct = (settings) => ({
  name: "",
  image: "",
  category: "",
  size: "",
  color: "",
  model: "",
  purchasePrice: "",
  salePrice: "",
  quantity: "",
  currency: settings.currency,
  supplierId: "",
  store: "Mağaza 1",
  warehouse: "Anbar A",
  shelf: "",
  box: "",
  minStock: settings.defaultMinStock,
  note: "",
  expenses: { yol: "", fehle: "", yer: "", paket: "", diger: "" },
});

const ProductForm = ({ open, onClose, initial }) => {
  const { state, dispatch } = useStore();
  const mergeInitial = () => {
    const base = emptyProduct(state.settings);
    if (!initial) return base;
    return {
      ...base,
      ...initial,
      expenses: { ...base.expenses, ...(initial.expenses || {}) },
    };
  };
  const [f, setF] = useState(mergeInitial);
  useEffect(() => {
    setF(mergeInitial());
  }, [initial, open]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setExp = (k, v) =>
    setF((x) => ({ ...x, expenses: { ...x.expenses, [k]: v } }));

  const qty = Number(f.quantity) || 0;
  const pp = Number(f.purchasePrice) || 0;
  const sp = Number(f.salePrice) || 0;
  const totalPurchase = pp * qty;
  const totalExp = ["yol", "fehle", "yer", "paket", "diger"].reduce(
    (s, k) => s + (Number(f.expenses[k]) || 0),
    0,
  );
  const totalCost = totalPurchase + totalExp;
  const realCost = qty > 0 ? totalCost / qty : 0;
  const profitPerUnit = sp - realCost;
  const profitPercent = realCost > 0 ? (profitPerUnit / realCost) * 100 : 0;
  const totalExpectedProfit = profitPerUnit * qty;
  const loss = sp > 0 && realCost > 0 && sp < realCost;

  const save = () => {
    if (!f.name.trim() || !qty || !pp || !sp) {
      dispatch({
        type: "TOAST",
        toast: {
          msg: "Mal adı, miqdar, alış və satış qiyməti mütləqdir.",
          kind: "error",
        },
      });
      return;
    }
    const location = [
      f.warehouse,
      f.shelf && `Rəf ${f.shelf}`,
      f.box && `Qutu ${f.box}`,
    ]
      .filter(Boolean)
      .join(" / ");
    const payload = {
      ...f,
      purchasePrice: pp,
      salePrice: sp,
      quantity: qty,
      minStock: Number(f.minStock) || 0,
      location: location || f.location,
    };
    if (initial?.id) {
      dispatch({ type: "UPDATE_PRODUCT", product: payload });
      dispatch({ type: "TOAST", toast: { msg: "Mal yeniləndi." } });
    } else {
      dispatch({ type: "ADD_PRODUCT", product: payload });
      dispatch({ type: "TOAST", toast: { msg: "Yeni mal əlavə edildi." } });
    }
    onClose();
  };

  const CalcRow = ({ label, value, bold, tone }) => (
    <div className="flex items-center justify-between py-1">
      <span
        className={`text-xs ${bold ? "font-bold text-stone-800" : "text-stone-500"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${bold ? "font-bold" : "font-semibold"} ${tone || "text-stone-800"}`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? "Malı redaktə et" : "Yeni mal əlavə et"}
      wide
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-3">
          <Field label="Mal adı" required>
            <Input
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Məs: Kişi cins şalvar"
            />
          </Field>
          <Field label="Şəkil URL">
            <Input
              value={f.image}
              onChange={(e) => set("image", e.target.value)}
              placeholder="https://... və ya boş saxlayın"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kateqoriya">
              <Input
                value={f.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Şalvar"
              />
            </Field>
            <Field label="Model">
              <Input
                value={f.model}
                onChange={(e) => set("model", e.target.value)}
              />
            </Field>
            <Field label="Ölçü">
              <Input
                value={f.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="30-38"
              />
            </Field>
            <Field label="Rəng">
              <Input
                value={f.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Alış qiyməti" required>
              <Input
                type="number"
                min="0"
                value={f.purchasePrice}
                onChange={(e) => set("purchasePrice", e.target.value)}
              />
            </Field>
            <Field label="Satış qiyməti" required>
              <Input
                type="number"
                min="0"
                value={f.salePrice}
                onChange={(e) => set("salePrice", e.target.value)}
              />
            </Field>
            <Field label="Miqdar" required>
              <Input
                type="number"
                min="0"
                value={f.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valyuta">
              <Select
                value={f.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                <option>AZN</option>
                <option>USD</option>
                <option>TRY</option>
              </Select>
            </Field>
            <Field label="Təchizatçı">
              <Select
                value={f.supplierId}
                onChange={(e) => set("supplierId", e.target.value)}
              >
                <option value="">Seçin...</option>
                {state.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mağaza">
              <Input
                value={f.store}
                onChange={(e) => set("store", e.target.value)}
              />
            </Field>
            <Field label="Anbar">
              <Input
                value={f.warehouse}
                onChange={(e) => set("warehouse", e.target.value)}
              />
            </Field>
            <Field label="Rəf">
              <Input
                value={f.shelf}
                onChange={(e) => set("shelf", e.target.value)}
                placeholder="3"
              />
            </Field>
            <Field label="Qutu nömrəsi">
              <Input
                value={f.box}
                onChange={(e) => set("box", e.target.value)}
                placeholder="12"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum stok">
              <Input
                type="number"
                min="0"
                value={f.minStock}
                onChange={(e) => set("minStock", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Qeyd">
            <Textarea
              value={f.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Partiya xərcləri
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Yol pulu">
                <Input
                  type="number"
                  min="0"
                  value={f.expenses.yol}
                  onChange={(e) => setExp("yol", e.target.value)}
                />
              </Field>
              <Field label="Fəhlə pulu">
                <Input
                  type="number"
                  min="0"
                  value={f.expenses.fehle}
                  onChange={(e) => setExp("fehle", e.target.value)}
                />
              </Field>
              <Field label="Yer/anbar xərci">
                <Input
                  type="number"
                  min="0"
                  value={f.expenses.yer}
                  onChange={(e) => setExp("yer", e.target.value)}
                />
              </Field>
              <Field label="Paket/qutu xərci">
                <Input
                  type="number"
                  min="0"
                  value={f.expenses.paket}
                  onChange={(e) => setExp("paket", e.target.value)}
                />
              </Field>
              <Field label="Digər xərc">
                <Input
                  type="number"
                  min="0"
                  value={f.expenses.diger}
                  onChange={(e) => setExp("diger", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 ${loss ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
          >
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-600">
              Avtomatik hesablama
            </h4>
            <CalcRow
              label="Toplam alış məbləği"
              value={fmtMoney(totalPurchase, f.currency)}
            />
            <CalcRow
              label="Toplam xərc"
              value={fmtMoney(totalExp, f.currency)}
            />
            <CalcRow
              label="Toplam maya"
              value={fmtMoney(totalCost, f.currency)}
              bold
            />
            <div className="my-1.5 border-t border-stone-200" />
            <CalcRow
              label="1 ədədin real mayası"
              value={fmtMoney(realCost, f.currency)}
              bold
              tone="text-emerald-800"
            />
            <CalcRow
              label="1 ədəd qazanc"
              value={fmtMoney(profitPerUnit, f.currency)}
              tone={profitPerUnit < 0 ? "text-red-600" : "text-emerald-700"}
            />
            <CalcRow
              label="Ümumi gözlənilən qazanc"
              value={fmtMoney(totalExpectedProfit, f.currency)}
              tone={
                totalExpectedProfit < 0 ? "text-red-600" : "text-emerald-700"
              }
            />
            <CalcRow
              label="Mənfəət faizi"
              value={`${profitPercent.toFixed(1)} %`}
              bold
              tone={profitPercent < 0 ? "text-red-600" : "text-emerald-700"}
            />
            {loss && (
              <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
                <AlertTriangle size={14} /> Satış qiyməti real mayadan aşağıdır
                — bu qiymətə ziyana satırsınız!
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2 border-t border-stone-100 pt-4">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button onClick={save}>
          <Check size={15} /> {initial?.id ? "Yadda saxla" : "Malı əlavə et"}
        </Button>
      </div>
    </Modal>
  );
};

const StockAdjustModal = ({ open, onClose, product, mode }) => {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState("");
  useEffect(() => setAmount(""), [open]);
  if (!product) return null;
  const apply = () => {
    const n = Number(amount) || 0;
    if (n <= 0) return;
    dispatch({
      type: "ADJUST_STOCK",
      productId: product.id,
      delta: mode === "add" ? n : -n,
    });
    dispatch({
      type: "TOAST",
      toast: {
        msg: `Stok ${mode === "add" ? "artırıldı" : "azaldıldı"}: ${product.name}`,
      },
    });
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Stok artır" : "Stok azalt"}
    >
      <p className="mb-3 text-sm text-stone-600">
        <b>{product.name}</b> — hazırkı stok: <b>{product.quantity} əd.</b>
      </p>
      <Field label="Miqdar" required>
        <Input
          type="number"
          min="1"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button onClick={apply}>
          {mode === "add" ? <Plus size={15} /> : <Minus size={15} />} Tətbiq et
        </Button>
      </div>
    </Modal>
  );
};

const ProductsPage = ({ globalSearch }) => {
  const { state, dispatch } = useStore();
  const d = useDerived();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [status, setStatus] = useState("");
  const [loc, setLoc] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockModal, setStockModal] = useState(null); // {product, mode}
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const search = (q || globalSearch || "").toLowerCase();
  const cats = [...new Set(state.products.map((p) => p.category))];
  const locs = [
    ...new Set(state.products.map((p) => (p.location || "").split(" / ")[0])),
  ].filter(Boolean);

  const filtered = d.withStatus.filter((p) => {
    if (
      search &&
      !`${p.name} ${p.category} ${p.model} ${p.color}`
        .toLowerCase()
        .includes(search)
    )
      return false;
    if (cat && p.category !== cat) return false;
    if (status && p.status !== status) return false;
    if (loc && !(p.location || "").startsWith(loc)) return false;
    if (priceMin && p.salePrice < Number(priceMin)) return false;
    if (priceMax && p.salePrice > Number(priceMax)) return false;
    return true;
  });

  const uiOnly = (msg) =>
    dispatch({ type: "TOAST", toast: { msg, kind: "warn" } });

  return (
    <div>
      <PageHead
        title="Mallar / Anbar"
        sub={`${state.products.length} mal · Anbar dəyəri: ${fmtMoney(d.stockValue)}`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                uiOnly("Excel import — demo rejimində aktiv deyil.")
              }
            >
              <Upload size={14} /> Excel import
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                uiOnly("Excel export — demo rejimində aktiv deyil.")
              }
            >
              <Download size={14} /> Excel export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                uiOnly("Barkod/QR çapı — demo rejimində aktiv deyil.")
              }
            >
              <Printer size={14} /> Barkod/QR çap
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} /> Yeni mal
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-6">
        <div className="relative col-span-2">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, model, rəng üzrə axtar..."
            className={`${inputCls} pl-8`}
          />
        </div>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Bütün kateqoriyalar</option>
          {cats.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Bütün statuslar</option>
          {["Stokda var", "Azalır", "Bitib", "Satılmır", "Ziyana satılır"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </Select>
        <Select value={loc} onChange={(e) => setLoc(e.target.value)}>
          <option value="">Bütün anbarlar</option>
          {locs.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </Select>
        <div className="flex gap-1.5">
          <Input
            type="number"
            placeholder="Min ₼"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Max ₼"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Mal tapılmadı"
          hint="Filterləri dəyişin və ya yeni mal əlavə edin."
          action={
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus size={14} /> Yeni mal
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <thead className="bg-stone-50">
            <tr>
              <Th>Mal</Th>
              <Th>Kateqoriya</Th>
              <Th>Ölçü / Rəng</Th>
              <Th right>Alış</Th>
              <Th right>Xərc payı</Th>
              <Th right>Real maya</Th>
              <Th right>Satış</Th>
              <Th right>Stok</Th>
              <Th>Anbar yeri</Th>
              <Th>Status</Th>
              <Th right>Əməliyyat</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((p) => {
              const expShare = p.realCostPerUnit - p.purchasePrice;
              return (
                <tr key={p.id} className="hover:bg-stone-50">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt=""
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <Package size={16} />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">{p.name}</p>
                        <p className="text-[11px] text-stone-400">{p.model}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>{p.category}</Td>
                  <Td>
                    <span className="text-xs">
                      {p.size} · {p.color}
                    </span>
                  </Td>
                  <Td right>{fmtMoney(p.purchasePrice)}</Td>
                  <Td right>
                    <span className="text-xs text-stone-500">
                      +{fmtMoney(expShare)}
                    </span>
                  </Td>
                  <Td right className="font-bold text-stone-900">
                    {fmtMoney(p.realCostPerUnit)}
                  </Td>
                  <Td
                    right
                    className={
                      p.salePrice < p.realCostPerUnit
                        ? "font-bold text-red-600"
                        : "font-semibold"
                    }
                  >
                    {fmtMoney(p.salePrice)}
                  </Td>
                  <Td right>
                    <span
                      className={`font-bold ${p.quantity === 0 ? "text-red-600" : p.quantity <= p.minStock ? "text-amber-600" : "text-stone-900"}`}
                    >
                      {p.quantity}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {" "}
                      / min {p.minStock}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs">{p.location}</span>
                  </Td>
                  <Td>
                    <Badge tone={p.status}>{p.status}</Badge>
                  </Td>
                  <Td right>
                    <div className="flex justify-end gap-1">
                      <button
                        title="Stok artır"
                        onClick={() =>
                          setStockModal({ product: p, mode: "add" })
                        }
                        className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Plus size={15} />
                      </button>
                      <button
                        title="Stok azalt"
                        onClick={() =>
                          setStockModal({ product: p, mode: "sub" })
                        }
                        className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                      >
                        <Minus size={15} />
                      </button>
                      <button
                        title="Redaktə et"
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                        className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                      >
                        <Pencil size={15} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      )}

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
      />
      <StockAdjustModal
        open={!!stockModal}
        onClose={() => setStockModal(null)}
        product={stockModal?.product}
        mode={stockModal?.mode}
      />
    </div>
  );
};

/* ============================================================
   src/pages/Sales.tsx  — Sürətli satış ekranı
   ============================================================ */
const NewCustomerModal = ({ open, onClose, onCreated }) => {
  const { dispatch } = useStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    setName("");
    setPhone("");
  }, [open]);
  const save = () => {
    if (!name.trim()) return;
    dispatch({ type: "ADD_CUSTOMER", customer: { name, phone } });
    dispatch({ type: "TOAST", toast: { msg: "Yeni müştəri əlavə edildi." } });
    onCreated?.(name);
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Yeni müştəri">
      <div className="space-y-3">
        <Field label="Müştəri adı" required>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Telefon">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="994xxxxxxxxx"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button onClick={save}>
          <Plus size={15} /> Əlavə et
        </Button>
      </div>
    </Modal>
  );
};

const SalesPage = () => {
  const { state, dispatch } = useStore();
  const d = useDerived();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [payType, setPayType] = useState("Nağd");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [newCusOpen, setNewCusOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const product = state.products.find((p) => p.id === productId);
  useEffect(() => {
    if (product) setPrice(String(product.salePrice));
  }, [productId]);

  const q = Math.max(1, Number(qty) || 1);
  const sp = Number(price) || 0;
  const disc = Number(discount) || 0;
  const realCost = product?.realCostPerUnit || 0;
  const gross = sp * q;
  const net = Math.max(0, gross - disc);
  const profit = net - realCost * q;
  const minPrice = realCost; // minimum satış qiyməti = real maya
  const belowCost = product && sp > 0 && net / q < realCost;
  const notEnoughStock = product && q > product.quantity;

  const canSubmit =
    product && sp > 0 && !notEnoughStock && (payType !== "Nisyə" || customerId);

  const complete = () => {
    dispatch({
      type: "ADD_SALE",
      sale: {
        productId: product.id,
        productName: product.name,
        quantity: q,
        salePrice: sp,
        discount: disc,
        paymentType: payType,
        customerId: payType === "Nisyə" ? customerId : null,
        totalAmount: gross,
        profit,
        note,
        employeeId: state.auth.user?.id || "emp_1",
      },
    });
    dispatch({
      type: "TOAST",
      toast: {
        msg: `Satış tamamlandı: ${product.name} × ${q} — ${fmtMoney(net)}`,
      },
    });
    setProductId("");
    setQty(1);
    setPrice("");
    setDiscount("");
    setPayType("Nağd");
    setCustomerId("");
    setNote("");
  };

  const trySubmit = () => {
    if (belowCost) setConfirmOpen(true);
    else complete();
  };

  const LiveRow = ({ label, value, tone, bold }) => (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-500"}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "text-lg font-bold" : "text-sm font-semibold"} ${tone || "text-stone-900"}`}
      >
        {value}
      </span>
    </div>
  );

  const todayList = [...d.todaySales].reverse();

  return (
    <div>
      <PageHead
        title="Satış"
        sub="Sürətli satış ekranı — 10 saniyəyə satışı tamamla"
      />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          <Card>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Field label="Mal seç" required>
                    <Select
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                    >
                      <option value="">Mal seçin...</option>
                      {d.withStatus
                        .filter((p) => p.quantity > 0)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — stok: {p.quantity} —{" "}
                            {fmtMoney(p.salePrice)}
                          </option>
                        ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Barkod scan">
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-400">
                    <Printer size={15} /> Skan gözlənilir...
                  </div>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Say" required>
                  <Input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </Field>
                <Field label="Satış qiyməti (1 əd.)" required>
                  <Input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Field>
                <Field label="Endirim (ümumi)">
                  <Input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Ödəniş növü">
                <div className="grid grid-cols-3 gap-2">
                  {["Nağd", "Kart", "Nisyə"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setPayType(t)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${payType === t ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"}`}
                    >
                      {t === "Nağd" ? (
                        <Wallet size={15} />
                      ) : t === "Kart" ? (
                        <CreditCard size={15} />
                      ) : (
                        <HandCoins size={15} />
                      )}{" "}
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              {payType === "Nisyə" && (
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field label="Müştəri" required>
                      <Select
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                      >
                        <option value="">Müştəri seçin...</option>
                        {state.customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} (borc: {fmtMoney(c.remainingDebt)})
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setNewCusOpen(true)}
                  >
                    <Plus size={14} /> Yeni
                  </Button>
                </div>
              )}
              <Field label="Qeyd">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="İstəyə bağlı"
                />
              </Field>

              {notEnoughStock && (
                <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">
                  <AlertTriangle size={15} /> Stokda kifayət qədər mal yoxdur
                  (mövcud: {product.quantity} əd.)
                </p>
              )}
              {belowCost && (
                <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">
                  <AlertTriangle size={15} /> Bu qiymətə satsan ziyana düşürsən.
                  Minimum qiymət: {fmtMoney(minPrice)}
                </p>
              )}

              <Button
                size="lg"
                className="w-full justify-center"
                disabled={!canSubmit}
                onClick={trySubmit}
              >
                <Check size={17} /> Satışı tamamla — {fmtMoney(net)}
              </Button>
            </div>
          </Card>

          <Card title={`Bugünkü satışlar (${todayList.length})`}>
            {todayList.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Bu gün hələ satış yoxdur"
                hint="İlk satışı yuxarıdakı formdan edin."
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {todayList.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                      {s.productName} × {s.quantity}
                    </span>
                    <Badge tone={s.paymentType}>{s.paymentType}</Badge>
                    <span className="w-24 text-right text-sm font-bold tabular-nums">
                      {fmtMoney(s.totalAmount - s.discount)}
                    </span>
                    <span
                      className={`w-24 text-right text-xs font-semibold tabular-nums ${s.profit < 0 ? "text-red-600" : "text-emerald-700"}`}
                    >
                      {s.profit >= 0 ? "+" : ""}
                      {fmtMoney(s.profit)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-16 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-sm font-bold text-stone-800">
              Canlı hesablama
            </h3>
            {!product ? (
              <EmptyState
                icon={ShoppingCart}
                title="Mal seçin"
                hint="Hesablamalar burada görünəcək."
              />
            ) : (
              <>
                <LiveRow label="Real maya (1 əd.)" value={fmtMoney(realCost)} />
                <LiveRow
                  label={`Satış məbləği (${q} əd.)`}
                  value={fmtMoney(gross)}
                />
                <LiveRow
                  label="Endirim"
                  value={`− ${fmtMoney(disc)}`}
                  tone="text-amber-600"
                />
                <div className="my-1 border-t border-stone-100" />
                <LiveRow label="Xalis satış" value={fmtMoney(net)} bold />
                <LiveRow
                  label="Qazanc"
                  value={`${profit >= 0 ? "+" : ""}${fmtMoney(profit)}`}
                  bold
                  tone={profit < 0 ? "text-red-600" : "text-emerald-700"}
                />
                <LiveRow
                  label="Minimum satış qiyməti"
                  value={fmtMoney(minPrice)}
                  tone="text-stone-500"
                />
                <div
                  className={`mt-3 rounded-lg px-3 py-2 text-xs font-semibold ${belowCost ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {belowCost
                    ? "Ziyan! Qiyməti qaldırın və ya endirimi azaldın."
                    : "Bu satış qazanclıdır."}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <NewCustomerModal
        open={newCusOpen}
        onClose={() => setNewCusOpen(false)}
      />
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={complete}
        danger
        title="Ziyanla satış təsdiqi"
        message={`Bu satış ${fmtMoney(Math.abs(profit))} ziyan verəcək. Yenə də davam etmək istəyirsiniz?`}
        confirmText="Bəli, ziyanla sat"
      />
    </div>
  );
};

/* ============================================================
   src/pages/Customers.tsx  — Nisyə Borclar
   ============================================================ */
const PaymentModal = ({ open, onClose, customer }) => {
  const { dispatch } = useStore();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Nağd");
  useEffect(() => {
    setAmount("");
    setMethod("Nağd");
  }, [open]);
  if (!customer) return null;
  const save = () => {
    const n = Number(amount) || 0;
    if (n <= 0) return;
    dispatch({
      type: "ADD_CUSTOMER_PAYMENT",
      customerId: customer.id,
      amount: n,
      method,
    });
    dispatch({
      type: "TOAST",
      toast: { msg: `Ödəniş qəbul edildi: ${fmtMoney(n)}` },
    });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="Ödəniş əlavə et">
      <p className="mb-3 text-sm text-stone-600">
        <b>{customer.name}</b> — qalıq borc:{" "}
        <b className="text-red-600">{fmtMoney(customer.remainingDebt)}</b>
      </p>
      <div className="space-y-3">
        <Field label="Məbləğ" required>
          <Input
            type="number"
            min="1"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Ödəniş üsulu">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Nağd</option>
            <option>Kart</option>
          </Select>
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button onClick={save}>
          <Check size={15} /> Ödənişi qəbul et
        </Button>
      </div>
    </Modal>
  );
};

const CustomersPage = () => {
  const { state } = useStore();
  const [selected, setSelected] = useState(null);
  const [payFor, setPayFor] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [q, setQ] = useState("");

  const customer = state.customers.find((c) => c.id === selected);
  const cusSales = customer
    ? state.sales.filter((s) => s.customerId === customer.id).reverse()
    : [];
  const cusPays = customer
    ? state.customerPayments.filter((p) => p.customerId === customer.id)
    : [];

  const waLink = (c) =>
    `https://wa.me/${(c.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(`Salam, sizdə ${c.remainingDebt.toFixed(2)} AZN qalıq borc görünür. Zəhmət olmasa ödənişi tamamlayın.`)}`;

  const filtered = state.customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.phone || "").includes(q),
  );
  const totalDebt = state.customers.reduce((s, c) => s + c.remainingDebt, 0);

  return (
    <div>
      <PageHead
        title="Nisyə Borclar"
        sub={`${state.customers.length} müştəri · Ümumi qalıq borc: ${fmtMoney(totalDebt)}`}
        actions={
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus size={14} /> Yeni müştəri
          </Button>
        }
      />
      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad və ya telefon üzrə axtar..."
            className={`${inputCls} pl-8`}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Müştəri tapılmadı" />
      ) : (
        <TableWrap>
          <thead className="bg-stone-50">
            <tr>
              <Th>Müştəri</Th>
              <Th>Telefon</Th>
              <Th right>Toplam borc</Th>
              <Th right>Ödənilən</Th>
              <Th right>Qalıq borc</Th>
              <Th>Son alış</Th>
              <Th>Son ödəniş</Th>
              <Th>Status</Th>
              <Th right>Əməliyyat</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-stone-50">
                <Td className="font-semibold text-stone-900">{c.name}</Td>
                <Td>
                  <span className="text-xs">{c.phone || "—"}</span>
                </Td>
                <Td right>{fmtMoney(c.totalDebt)}</Td>
                <Td right className="text-emerald-700">
                  {fmtMoney(c.paidAmount)}
                </Td>
                <Td
                  right
                  className={`font-bold ${c.remainingDebt > 0 ? "text-red-600" : "text-emerald-700"}`}
                >
                  {fmtMoney(c.remainingDebt)}
                </Td>
                <Td>{fmtDate(c.lastPurchaseDate)}</Td>
                <Td>{fmtDate(c.lastPaymentDate)}</Td>
                <Td>
                  <Badge tone={c.remainingDebt > 0 ? "Borclu" : "Ödənilib"}>
                    {c.remainingDebt > 0 ? "Borclu" : "Ödənilib"}
                  </Badge>
                </Td>
                <Td right>
                  <div className="flex justify-end gap-1">
                    <button
                      title="Detal"
                      onClick={() => setSelected(c.id)}
                      className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      title="Ödəniş"
                      onClick={() => setPayFor(c)}
                      className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
                    >
                      <HandCoins size={15} />
                    </button>
                    <a
                      title="WhatsApp xatırlatma"
                      href={waLink(c)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md p-1.5 text-green-600 hover:bg-green-50"
                    >
                      <MessageCircle size={15} />
                    </a>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Drawer
        open={!!customer}
        onClose={() => setSelected(null)}
        title={customer?.name || ""}
      >
        {customer && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Toplam borc"
                value={fmtMoney(customer.totalDebt)}
              />
              <StatCard
                label="Ödənilən"
                value={fmtMoney(customer.paidAmount)}
                tone="green"
              />
              <StatCard
                label="Qalıq"
                value={fmtMoney(customer.remainingDebt)}
                tone={customer.remainingDebt > 0 ? "red" : "green"}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setPayFor(customer)}>
                <HandCoins size={14} /> Ödəniş əlavə et
              </Button>
              <a href={waLink(customer)} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  <MessageCircle size={14} className="text-green-600" />{" "}
                  WhatsApp xatırlatma
                </Button>
              </a>
            </div>
            <div className="text-sm text-stone-600">
              <p className="flex items-center gap-1.5">
                <Phone size={13} /> {customer.phone || "—"}
              </p>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Aldığı mallar / borc tarixçəsi
              </h4>
              {cusSales.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Nisyə alış yoxdur" />
              ) : (
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {cusSales.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {s.productName} × {s.quantity}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {fmtDate(s.createdAt)}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-red-600">
                        +{fmtMoney(s.totalAmount - s.discount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Ödəniş tarixçəsi
              </h4>
              {cusPays.length === 0 ? (
                <EmptyState icon={HandCoins} title="Ödəniş yoxdur" />
              ) : (
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {cusPays.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-stone-800">
                          {p.method}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          {fmtDate(p.date)}
                        </p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-emerald-700">
                        −{fmtMoney(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <PaymentModal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        customer={payFor}
      />
      <NewCustomerModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
};

/* ============================================================
   src/pages/Suppliers.tsx  — Təchizatçı borcları
   ============================================================ */
const SuppliersPage = () => {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null); // {type: 'new'|'debt'|'pay', supplier}
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  useEffect(() => {
    setName("");
    setPhone("");
    setAmount("");
  }, [modal]);

  const supplier = state.suppliers.find((s) => s.id === selected);
  const supPays = supplier
    ? state.supplierPayments.filter((p) => p.supplierId === supplier.id)
    : [];
  const supProducts = supplier
    ? state.products.filter((p) => p.supplierId === supplier.id)
    : [];
  const totalDebt = state.suppliers.reduce((s, x) => s + x.remainingDebt, 0);

  const save = () => {
    if (modal.type === "new") {
      if (!name.trim()) return;
      dispatch({ type: "ADD_SUPPLIER", supplier: { name, phone } });
      dispatch({ type: "TOAST", toast: { msg: "Təchizatçı əlavə edildi." } });
    } else {
      const n = Number(amount) || 0;
      if (n <= 0) return;
      if (modal.type === "debt") {
        dispatch({
          type: "ADD_SUPPLIER_DEBT",
          supplierId: modal.supplier.id,
          amount: n,
        });
        dispatch({
          type: "TOAST",
          toast: { msg: `Borc əlavə edildi: ${fmtMoney(n)}`, kind: "warn" },
        });
      } else {
        dispatch({
          type: "ADD_SUPPLIER_PAYMENT",
          supplierId: modal.supplier.id,
          amount: n,
        });
        dispatch({
          type: "TOAST",
          toast: { msg: `Ödəniş edildi: ${fmtMoney(n)}` },
        });
      }
    }
    setModal(null);
  };

  return (
    <div>
      <PageHead
        title="Təchizatçılar"
        sub={`${state.suppliers.length} təchizatçı · Mənim qalıq borcum: ${fmtMoney(totalDebt)}`}
        actions={
          <Button size="sm" onClick={() => setModal({ type: "new" })}>
            <Plus size={14} /> Təchizatçı əlavə et
          </Button>
        }
      />
      <TableWrap>
        <thead className="bg-stone-50">
          <tr>
            <Th>Təchizatçı</Th>
            <Th>Telefon</Th>
            <Th right>Mal sayı</Th>
            <Th right>Toplam borc</Th>
            <Th right>Ödənilən</Th>
            <Th right>Qalıq borc</Th>
            <Th>Son ödəniş</Th>
            <Th right>Əməliyyat</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {state.suppliers.map((s) => (
            <tr key={s.id} className="hover:bg-stone-50">
              <Td className="font-semibold text-stone-900">{s.name}</Td>
              <Td>
                <span className="text-xs">{s.phone || "—"}</span>
              </Td>
              <Td right>
                {s.itemCount ||
                  state.products.filter((p) => p.supplierId === s.id).length}
              </Td>
              <Td right>{fmtMoney(s.totalDebt)}</Td>
              <Td right className="text-emerald-700">
                {fmtMoney(s.paidAmount)}
              </Td>
              <Td
                right
                className={`font-bold ${s.remainingDebt > 0 ? "text-red-600" : "text-emerald-700"}`}
              >
                {fmtMoney(s.remainingDebt)}
              </Td>
              <Td>{fmtDate(s.lastPaymentDate)}</Td>
              <Td right>
                <div className="flex justify-end gap-1">
                  <button
                    title="Detal"
                    onClick={() => setSelected(s.id)}
                    className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    title="Borc əlavə et"
                    onClick={() => setModal({ type: "debt", supplier: s })}
                    className="rounded-md p-1.5 text-amber-600 hover:bg-amber-50"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    title="Ödəniş et"
                    onClick={() => setModal({ type: "pay", supplier: s })}
                    className="rounded-md p-1.5 text-emerald-700 hover:bg-emerald-50"
                  >
                    <HandCoins size={15} />
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>

      <Drawer
        open={!!supplier}
        onClose={() => setSelected(null)}
        title={supplier?.name || ""}
      >
        {supplier && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Toplam borc"
                value={fmtMoney(supplier.totalDebt)}
              />
              <StatCard
                label="Ödənilən"
                value={fmtMoney(supplier.paidAmount)}
                tone="green"
              />
              <StatCard
                label="Qalıq"
                value={fmtMoney(supplier.remainingDebt)}
                tone={supplier.remainingDebt > 0 ? "red" : "green"}
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="warn"
                onClick={() => setModal({ type: "debt", supplier })}
              >
                <Plus size={14} /> Borc əlavə et
              </Button>
              <Button
                size="sm"
                onClick={() => setModal({ type: "pay", supplier })}
              >
                <HandCoins size={14} /> Ödəniş et
              </Button>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Bu təchizatçıdan alınan mallar
              </h4>
              {supProducts.length === 0 ? (
                <EmptyState icon={Package} title="Mal yoxdur" />
              ) : (
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {supProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                        {p.name}
                      </span>
                      <span className="text-xs text-stone-400">
                        {p.quantity} əd. stokda
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Ödəniş tarixçəsi
              </h4>
              {supPays.length === 0 ? (
                <EmptyState icon={HandCoins} title="Ödəniş yoxdur" />
              ) : (
                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {supPays.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span className="flex-1 text-sm text-stone-600">
                        {fmtDate(p.date)}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-emerald-700">
                        −{fmtMoney(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={
          modal?.type === "new"
            ? "Yeni təchizatçı"
            : modal?.type === "debt"
              ? `Borc əlavə et — ${modal?.supplier?.name}`
              : `Ödəniş et — ${modal?.supplier?.name}`
        }
      >
        <div className="space-y-3">
          {modal?.type === "new" ? (
            <>
              <Field label="Ad" required>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Telefon">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </>
          ) : (
            <Field label="Məbləğ" required>
              <Input
                type="number"
                min="1"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
            </Field>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>
            İmtina
          </Button>
          <Button onClick={save}>
            <Check size={15} /> Təsdiq et
          </Button>
        </div>
      </Modal>
    </div>
  );
};

/* ============================================================
   src/pages/Expenses.tsx  — Xərclər
   ============================================================ */
const EXP_CATS = ["Yol", "Fəhlə", "Anbar/Yer", "Paket/Qutu", "Mağaza", "Digər"];

const ExpensesPage = () => {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: "",
    category: "Yol",
    amount: "",
    date: todayISO(),
    productId: "",
    note: "",
  });
  useEffect(() => {
    setF({
      title: "",
      category: "Yol",
      amount: "",
      date: todayISO(),
      productId: "",
      note: "",
    });
  }, [open]);

  const total = state.expenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal = state.expenses
    .filter((e) => e.date === todayISO())
    .reduce((s, e) => s + e.amount, 0);

  const save = () => {
    const n = Number(f.amount) || 0;
    if (!f.title.trim() || n <= 0) {
      dispatch({
        type: "TOAST",
        toast: { msg: "Xərc adı və məbləğ mütləqdir.", kind: "error" },
      });
      return;
    }
    dispatch({
      type: "ADD_EXPENSE",
      expense: { ...f, amount: n, productId: f.productId || null },
    });
    dispatch({
      type: "TOAST",
      toast: {
        msg: f.productId
          ? "Xərc əlavə edildi — malın real mayası yeniləndi."
          : "Xərc əlavə edildi.",
      },
    });
    setOpen(false);
  };

  return (
    <div>
      <PageHead
        title="Xərclər"
        sub={`Bu gün: ${fmtMoney(todayTotal)} · Ümumi: ${fmtMoney(total)}`}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={14} /> Xərc əlavə et
          </Button>
        }
      />
      {state.expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Xərc yoxdur"
          hint="İlk xərci əlavə edin."
        />
      ) : (
        <TableWrap>
          <thead className="bg-stone-50">
            <tr>
              <Th>Xərc</Th>
              <Th>Kateqoriya</Th>
              <Th right>Məbləğ</Th>
              <Th>Tarix</Th>
              <Th>Bağlı mal</Th>
              <Th>Qeyd</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {state.expenses.map((e) => (
              <tr key={e.id} className="hover:bg-stone-50">
                <Td className="font-semibold text-stone-900">{e.title}</Td>
                <Td>
                  <Badge>{e.category}</Badge>
                </Td>
                <Td right className="font-bold text-red-600">
                  −{fmtMoney(e.amount)}
                </Td>
                <Td>{fmtDate(e.date)}</Td>
                <Td>
                  <span className="text-xs">
                    {state.products.find((p) => p.id === e.productId)?.name ||
                      "Ümumi xərc"}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs text-stone-400">
                    {e.note || "—"}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Xərc əlavə et">
        <div className="space-y-3">
          <Field label="Xərc adı" required>
            <Input
              autoFocus
              value={f.title}
              onChange={(e) => setF({ ...f, title: e.target.value })}
              placeholder="Məs: Karqo çatdırılma"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kateqoriya">
              <Select
                value={f.category}
                onChange={(e) => setF({ ...f, category: e.target.value })}
              >
                {EXP_CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Məbləğ" required>
              <Input
                type="number"
                min="0"
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tarix">
            <Input
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </Field>
          <Field
            label="Hansı mala/partiyaya aiddir"
            hint="Seçilsə, bu xərc malın real mayasına əlavə olunacaq."
          >
            <Select
              value={f.productId}
              onChange={(e) => setF({ ...f, productId: e.target.value })}
            >
              <option value="">Ümumi xərc (mala bağlı deyil)</option>
              {state.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Qeyd">
            <Textarea
              value={f.note}
              onChange={(e) => setF({ ...f, note: e.target.value })}
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            İmtina
          </Button>
          <Button onClick={save}>
            <Check size={15} /> Əlavə et
          </Button>
        </div>
      </Modal>
    </div>
  );
};

/* ============================================================
   src/pages/DayEnd.tsx  — Gün sonu bağlanış
   ============================================================ */
const DayEndPage = () => {
  const { state, dispatch } = useStore();
  const d = useDerived();
  const [openingCash, setOpeningCash] = useState(
    String(state.settings.openingCash),
  );
  const [actualCash, setActualCash] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const oc = Number(openingCash) || 0;
  const expectedCash = oc + d.todayCash - d.todayExpenses;
  const ac = actualCash === "" ? null : Number(actualCash) || 0;
  const difference = ac === null ? null : ac - expectedCash;
  const alreadyClosed = state.closings.some((c) => c.date === todayISO());

  const closeDay = () => {
    dispatch({
      type: "CLOSE_DAY",
      closing: {
        date: todayISO(),
        openingCash: oc,
        cashSales: d.todayCash,
        cardSales: d.todayCard,
        creditSales: d.todayCredit,
        expenses: d.todayExpenses,
        expectedCash,
        actualCash: ac ?? expectedCash,
        difference: difference ?? 0,
      },
    });
    dispatch({ type: "TOAST", toast: { msg: "Gün sonu bağlandı." } });
  };

  const Row = ({ label, value, tone, bold }) => (
    <div className="flex items-center justify-between border-b border-stone-100 py-2.5 last:border-0">
      <span
        className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-600"}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? "text-base font-bold" : "text-sm font-semibold"} ${tone || "text-stone-900"}`}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div>
      <PageHead
        title="Gün Sonu Bağlanış"
        sub={fmtDate(todayISO()) + " — kassanı sayın və günü bağlayın"}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Bugünkü hesab">
          <Row
            label="Başlanğıc kassa"
            value={
              <input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="w-28 rounded-lg border border-stone-300 px-2 py-1 text-right text-sm font-semibold tabular-nums focus:border-emerald-600 focus:outline-none"
              />
            }
          />
          <Row
            label="Nağd satış"
            value={`+ ${fmtMoney(d.todayCash)}`}
            tone="text-emerald-700"
          />
          <Row
            label="Kart satış (kassaya düşmür)"
            value={fmtMoney(d.todayCard)}
            tone="text-indigo-600"
          />
          <Row
            label="Nisyə satış (kassaya düşmür)"
            value={fmtMoney(d.todayCredit)}
            tone="text-amber-600"
          />
          <Row
            label="Günlük xərclər"
            value={`− ${fmtMoney(d.todayExpenses)}`}
            tone="text-red-600"
          />
          <Row
            label="Kassada olmalı məbləğ"
            value={fmtMoney(expectedCash)}
            bold
            tone="text-emerald-800"
          />
        </Card>

        <div className="space-y-4">
          <Card title="Faktiki sayım">
            <Field
              label="Faktiki sayılan pul"
              required
              hint="Kassadakı nağdı sayıb bura yazın."
            >
              <Input
                type="number"
                min="0"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            {difference !== null && (
              <div
                className={`mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-bold ring-1 ${difference < 0 ? "bg-red-50 text-red-700 ring-red-200" : difference > 0 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-stone-50 text-stone-700 ring-stone-200"}`}
              >
                {difference < 0 ? (
                  <TrendingDown size={18} />
                ) : difference > 0 ? (
                  <TrendingUp size={18} />
                ) : (
                  <Check size={18} />
                )}
                {difference < 0
                  ? `Kassada çatışmayan məbləğ: ${fmtMoney(Math.abs(difference))}`
                  : difference > 0
                    ? `Kassada artıq məbləğ: ${fmtMoney(difference)}`
                    : "Kassa tam düz gəlir. Fərq: 0.00 AZN"}
              </div>
            )}
            <Button
              size="lg"
              className="mt-4 w-full justify-center"
              disabled={ac === null || alreadyClosed}
              onClick={() => setConfirmOpen(true)}
            >
              <Lock size={16} />{" "}
              {alreadyClosed ? "Bu gün artıq bağlanıb" : "Gün sonunu bağla"}
            </Button>
          </Card>

          <Card title="Əvvəlki bağlanışlar">
            {state.closings.length === 0 ? (
              <EmptyState icon={Lock} title="Bağlanış yoxdur" />
            ) : (
              <div className="divide-y divide-stone-100">
                {[...state.closings].reverse().map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 py-2 first:pt-0 last:pb-0"
                  >
                    <Clock size={14} className="text-stone-400" />
                    <span className="flex-1 text-sm text-stone-700">
                      {fmtDate(c.date)}
                    </span>
                    <span className="text-xs text-stone-400">
                      gözlənilən {fmtMoney(c.expectedCash)}
                    </span>
                    <span
                      className={`w-28 text-right text-sm font-bold tabular-nums ${c.difference < 0 ? "text-red-600" : c.difference > 0 ? "text-emerald-700" : "text-stone-700"}`}
                    >
                      {c.difference === 0
                        ? "±0.00"
                        : (c.difference > 0 ? "+" : "") +
                          fmtMoney(c.difference)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={closeDay}
        title="Gün sonu bağlanışı"
        confirmText="Bəli, günü bağla"
        message={`Kassada olmalı: ${fmtMoney(expectedCash)}. Sayılan: ${fmtMoney(ac ?? 0)}. Fərq: ${fmtMoney(difference ?? 0)}. Gün bağlandıqdan sonra dəyişiklik olmayacaq.`}
      />
    </div>
  );
};

/* ============================================================
   src/pages/Reports.tsx  — Hesabatlar
   ============================================================ */
const PIE_COLORS = [
  "#047857",
  "#b45309",
  "#0369a1",
  "#be123c",
  "#7c3aed",
  "#57534e",
];

const ReportsPage = () => {
  const { state } = useStore();
  const d = useDerived();
  const sum = (arr, f) => arr.reduce((a, x) => a + f(x), 0);

  const monthSales = state.sales.filter((s) => daysBetween(s.createdAt) <= 30);
  const monthTotal = sum(monthSales, (s) => s.totalAmount - s.discount);
  const monthProfit = sum(monthSales, (s) => s.profit);
  const totalExp = sum(state.expenses, (e) => e.amount);
  const cashVsCredit = [
    {
      name: "Nağd",
      value: sum(
        state.sales.filter((s) => s.paymentType === "Nağd"),
        (s) => s.totalAmount - s.discount,
      ),
    },
    {
      name: "Kart",
      value: sum(
        state.sales.filter((s) => s.paymentType === "Kart"),
        (s) => s.totalAmount - s.discount,
      ),
    },
    {
      name: "Nisyə",
      value: sum(
        state.sales.filter((s) => s.paymentType === "Nisyə"),
        (s) => s.totalAmount - s.discount,
      ),
    },
  ];
  const pieData = Object.entries(d.expByCat).map(([name, value]) => ({
    name,
    value,
  }));
  const topBar = d.topProducts
    .slice(0, 6)
    .map(({ product, qty }) => ({
      name:
        product.name.length > 18
          ? product.name.slice(0, 17) + "…"
          : product.name,
      qty,
    }));
  const leastSold = [...d.topProducts].reverse().slice(0, 5);
  const lossSellers = d.withStatus.filter(
    (p) => p.salePrice < p.realCostPerUnit,
  );
  const frozenGroups = [30, 60, 90].map((days) => ({
    days,
    items: d.frozen.filter(
      (p) =>
        p.idleDays >= days && p.idleDays < (days === 90 ? 100000 : days + 30),
    ),
  }));

  return (
    <div>
      <PageHead title="Hesabatlar" sub="Son 30 günün mənzərəsi" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Gündəlik satış (bu gün)"
          value={fmtMoney(d.todayTotal)}
        />
        <StatCard label="Aylıq satış" value={fmtMoney(monthTotal)} />
        <StatCard
          label="Xalis qazanc (30 gün)"
          value={fmtMoney(monthProfit)}
          tone="green"
        />
        <StatCard label="Ümumi xərc" value={fmtMoney(totalExp)} tone="red" />
        <StatCard label="Anbar dəyəri" value={fmtMoney(d.stockValue)} />
        <StatCard
          label="Mənə borclular"
          value={fmtMoney(d.receivables)}
          tone="amber"
          sub={`Mənim borcum: ${fmtMoney(d.payables)}`}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Günlük satış (son 7 gün)">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={d.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v) => fmtMoney(v)} />
              <Legend />
              <Bar
                dataKey="satis"
                name="Satış"
                fill="#047857"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="qazanc"
                name="Qazanc"
                fill="#b45309"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Həftəlik qazanc (son 30 gün)">
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={d.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RTooltip formatter={(v) => fmtMoney(v)} />
              <Line
                type="monotone"
                dataKey="qazanc"
                name="Qazanc"
                stroke="#047857"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Xərc kateqoriyaları">
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(e) => e.name}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <RTooltip formatter={(v) => fmtMoney(v)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Ən çox satılan mallar">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={topBar} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10 }}
                width={120}
              />
              <RTooltip />
              <Bar
                dataKey="qty"
                name="Satılan ədəd"
                fill="#047857"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Nağd / Kart / Nisyə müqayisəsi (30 gün)">
          <div className="space-y-3">
            {cashVsCredit.map((x, i) => {
              const total = cashVsCredit.reduce((s, y) => s + y.value, 0) || 1;
              const pct = (x.value / total) * 100;
              return (
                <div key={x.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-stone-700">
                      {x.name}
                    </span>
                    <span className="font-bold tabular-nums">
                      {fmtMoney(x.value)}{" "}
                      <span className="text-xs font-normal text-stone-400">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: PIE_COLORS[i] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card title="Ən az satılan mallar">
          <div className="space-y-2.5">
            {leastSold.map(({ product, qty }) => (
              <div key={product.id} className="flex items-center gap-2.5">
                <TrendingDown size={14} className="text-stone-400" />
                <span className="flex-1 truncate text-sm text-stone-700">
                  {product.name}
                </span>
                <span className="text-sm font-bold tabular-nums text-stone-500">
                  {qty} əd.
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card title="Satılmayan mallar (30/60/90 gün)">
          {d.frozen.length === 0 ? (
            <EmptyState icon={Snowflake} title="Donmuş mal yoxdur" />
          ) : (
            <div className="space-y-4">
              {frozenGroups.map(
                (g) =>
                  g.items.length > 0 && (
                    <div key={g.days}>
                      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-sky-700">
                        {g.days}+ gün satılmır
                      </p>
                      {g.items.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 py-1"
                        >
                          <Snowflake size={13} className="text-sky-400" />
                          <span className="flex-1 truncate text-sm text-stone-700">
                            {p.name}
                          </span>
                          <span className="text-xs text-stone-400">
                            {p.quantity} əd.
                          </span>
                          <span className="w-24 text-right text-sm font-bold tabular-nums text-sky-700">
                            {fmtMoney(p.realCostPerUnit * p.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ),
              )}
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                Cəmi dondurulmuş pul:{" "}
                {fmtMoney(
                  d.frozen.reduce(
                    (s, p) => s + p.realCostPerUnit * p.quantity,
                    0,
                  ),
                )}
              </p>
            </div>
          )}
        </Card>
        <Card title="Ziyana satılan mallar">
          {lossSellers.length === 0 ? (
            <EmptyState icon={Check} title="Ziyana satılan mal yoxdur" />
          ) : (
            <div className="space-y-2.5">
              {lossSellers.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <AlertTriangle size={14} className="text-rose-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-stone-800">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-stone-400">
                      maya {fmtMoney(p.realCostPerUnit)} → satış{" "}
                      {fmtMoney(p.salePrice)}
                    </p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-rose-600">
                    −{fmtMoney((p.realCostPerUnit - p.salePrice) * p.quantity)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ============================================================
   src/pages/Employees.tsx  — İşçilər + activity log
   ============================================================ */
const EmployeesPage = () => {
  const { state } = useStore();
  const t = todayISO();
  const stats = (id) => {
    const s = state.sales.filter(
      (x) => x.employeeId === id && x.createdAt === t,
    );
    return {
      todaySales: s.reduce((a, x) => a + x.totalAmount - x.discount, 0),
      discounts: state.sales.filter(
        (x) => x.employeeId === id && x.discount > 0,
      ).length,
      lastActivity:
        state.activity.find((a) => a.employeeId === id)?.date || null,
    };
  };
  return (
    <div>
      <PageHead title="İşçilər" sub={`${state.employees.length} işçi`} />
      <TableWrap>
        <thead className="bg-stone-50">
          <tr>
            <Th>Ad</Th>
            <Th>Telefon</Th>
            <Th>Rol</Th>
            <Th>Status</Th>
            <Th right>Bugünkü satış</Th>
            <Th right>Endirim sayı</Th>
            <Th>Son aktivlik</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {state.employees.map((e) => {
            const s = stats(e.id);
            return (
              <tr key={e.id} className="hover:bg-stone-50">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                      {e.name[0]}
                    </div>
                    <span className="font-semibold text-stone-900">
                      {e.name}
                    </span>
                  </div>
                </Td>
                <Td>
                  <span className="text-xs">{e.phone}</span>
                </Td>
                <Td>
                  <Badge>{e.role}</Badge>
                </Td>
                <Td>
                  <Badge tone={e.status}>{e.status}</Badge>
                </Td>
                <Td right className="font-bold">
                  {fmtMoney(s.todaySales)}
                </Td>
                <Td right>{s.discounts}</Td>
                <Td>{fmtDate(s.lastActivity)}</Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      <div className="mt-5">
        <Card title="Fəaliyyət jurnalı (activity log)">
          {state.activity.length === 0 ? (
            <EmptyState icon={Clock} title="Fəaliyyət yoxdur" />
          ) : (
            <div className="divide-y divide-stone-100">
              {state.activity.slice(0, 20).map((a) => {
                const emp = state.employees.find((e) => e.id === a.employeeId);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[11px] font-bold text-stone-600">
                      {emp?.name?.[0] || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-stone-800">
                        <b>{emp?.name || "Naməlum"}</b> — {a.action}
                      </p>
                      <p className="truncate text-xs text-stone-400">
                        {a.detail}
                      </p>
                    </div>
                    <span className="text-xs text-stone-400">
                      {fmtDate(a.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ============================================================
   src/pages/Settings.tsx  — Ayarlar
   ============================================================ */
const SettingsPage = () => {
  const { state, dispatch } = useStore();
  const [f, setF] = useState(state.settings);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    dispatch({
      type: "UPDATE_SETTINGS",
      settings: {
        ...f,
        defaultMinStock: Number(f.defaultMinStock) || 0,
        openingCash: Number(f.openingCash) || 0,
      },
    });
    dispatch({ type: "TOAST", toast: { msg: "Ayarlar yadda saxlandı." } });
  };
  const PERMS = [
    {
      role: "Sahibkar",
      desc: "Hər şeyə tam icazə: satış, mal, borc, gün sonu, hesabatlar, ayarlar.",
    },
    {
      role: "Menecer",
      desc: "Satış, mal, borc və gün sonu. Ayarlara giriş yoxdur.",
    },
    {
      role: "Satıcı",
      desc: "Yalnız satış edə bilər. Endirim üçün menecer təsdiqi lazımdır.",
    },
  ];
  return (
    <div>
      <PageHead
        title="Ayarlar"
        sub="Mağaza və sistem parametrləri"
        actions={
          <Button size="sm" onClick={save}>
            <Check size={14} /> Yadda saxla
          </Button>
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Mağaza məlumatları">
          <div className="space-y-3">
            <Field label="Mağaza adı">
              <Input
                value={f.storeName}
                onChange={(e) => set("storeName", e.target.value)}
              />
            </Field>
            <Field label="Sahibkar adı">
              <Input
                value={f.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
              />
            </Field>
            <Field
              label="WhatsApp nömrəsi"
              hint="Borc xatırlatmaları bu nömrədən göndərilmiş kimi görünür."
            >
              <Input
                value={f.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <Card title="Sistem parametrləri">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Default valyuta">
                <Select
                  value={f.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  <option>AZN</option>
                  <option>USD</option>
                  <option>TRY</option>
                </Select>
              </Field>
              <Field label="Minimum stok (default)">
                <Input
                  type="number"
                  min="0"
                  value={f.defaultMinStock}
                  onChange={(e) => set("defaultMinStock", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Başlanğıc kassa (günlük)">
              <Input
                type="number"
                min="0"
                value={f.openingCash}
                onChange={(e) => set("openingCash", e.target.value)}
              />
            </Field>
            <Field label="Dil">
              <Select
                value={f.language}
                onChange={(e) => set("language", e.target.value)}
              >
                <option>Azərbaycan dili</option>
              </Select>
            </Field>
            <Field label="Qazanc hesablanma qaydası">
              <Select
                value={f.profitMode}
                onChange={(e) => set("profitMode", e.target.value)}
              >
                <option>Real maya ilə (alış + xərclər)</option>
                <option>Yalnız alış qiyməti ilə</option>
              </Select>
            </Field>
          </div>
        </Card>
        <Card title="İşçi icazələri" className="lg:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {PERMS.map((p) => (
              <div
                key={p.role}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <Badge>{p.role}</Badge>
                <p className="mt-2 text-sm text-stone-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

/* ============================================================
   src/App.tsx  — kök komponent və "routing"
   ============================================================ */
const Shell = () => {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");

  const onSearch = (v) => {
    setSearch(v);
    if (v && page !== "products") setPage("products");
  };

  const pages = {
    dashboard: <DashboardPage setPage={setPage} />,
    products: <ProductsPage globalSearch={search} />,
    sales: <SalesPage />,
    customers: <CustomersPage />,
    suppliers: <SuppliersPage />,
    expenses: <ExpensesPage />,
    dayend: <DayEndPage />,
    reports: <ReportsPage />,
    employees: <EmployeesPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="min-h-screen bg-stone-100">
      <Sidebar
        page={page}
        setPage={setPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="lg:pl-60">
        <Topbar
          setMobileOpen={setMobileOpen}
          onSearch={onSearch}
          search={search}
        />
        <main className="mx-auto max-w-7xl p-4 lg:p-6">{pages[page]}</main>
      </div>
    </div>
  );
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreCtx.Provider value={{ state, dispatch }}>
      {state.auth.loggedIn ? <Shell /> : <LoginPage />}
      <Toasts />
    </StoreCtx.Provider>
  );
}
