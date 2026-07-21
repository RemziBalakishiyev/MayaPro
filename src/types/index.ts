/** Modullar arası paylaşılan ortaq tiplər. */

export type PaymentType = "Nağd" | "Kart" | "Nisyə";

export type ProductStatus =
  | "Stokda var"
  | "Azalır"
  | "Bitib"
  | "Satılmır"
  | "Ziyana satılır";

export type ExpenseCategory =
  | "Yol"
  | "Fəhlə"
  | "Anbar/Yer"
  | "Paket/Qutu"
  | "Mağaza"
  | "Digər";

/** Auth istifadəçisinin rolu. */
export type Role = "sahib" | "menecer" | "satici";

/** Malın partiya xərci sətri — sərbəst ad + məbləğ. */
export interface ProductExpenseLine {
  name: string;
  amount: number;
}

/** Məhsul kateqoriyası. */
export interface Category {
  id: string;
  name: string;
}

/** Malın dinamik xüsusiyyəti (ad + dəyər), məs. { name: "Ölçü", value: "M" }. */
export interface ProductAttribute {
  name: string;
  value: string;
}

/** Anbardakı mal. */
export interface Product {
  id: string;
  name: string;
  category: string;
  /** Dinamik xüsusiyyətlər (köhnə size/color/model əvəzinə). */
  attributes: ProductAttribute[];
  barcode: string;
  image: string;
  note: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  initialQuantity: number;
  minStock: number;
  currency: string;
  supplierId: string;
  /** Yığcam ünvan: "Anbar A / Rəf 3 / Qutu 12" */
  location: string;
  store: string;
  warehouse: string;
  shelf: string;
  box: string;
  expenses: ProductExpenseLine[];
  /** Hesablanmış 1 ədədin real mayası */
  realCostPerUnit: number;
  createdAt: string;
  updatedAt: string;
}

/** Sərbəst satış xərc sətri — sənədləşmə üçün (maya hesablamasına təsir etmir). */
export type SaleExpenseItem = ProductExpenseLine;

export interface Sale {
  id: string;
  /** Katalog malı satışında dolu; sərbəst (manual) satışda null. */
  productId: string | null;
  productName: string;
  /** Kateqoriya snapshot; katalogda maldan, sərbəstdə istəyə bağlı. */
  category?: string | null;
  quantity: number;
  salePrice: number;
  /** Endirimdən əvvəlki cəm (salePrice × quantity) */
  subtotal: number;
  discount: number;
  /** Endirimdən sonrakı yekun məbləğ (subtotal − discount) */
  totalAmount: number;
  paymentType: PaymentType;
  customerId: string | null;
  /** Satış anındakı real maya snapshot-u (1 ədəd); manual satışda maya bilinmirsə null. */
  costPerUnit?: number | null;
  /** Qazanc; manual satışda maya naməlumdursa null ("naməlum"). */
  profit: number | null;
  /** Sərbəst (katalogdankənar) satış bayrağı. */
  isManual?: boolean;
  /** Sərbəst satışda mayanı izah edən xərc sətirləri; normal satışda boş. */
  expenseItems?: SaleExpenseItem[];
  /** Satıcı adı (backend soldByName snapshot). */
  soldByName?: string | null;
  createdAt: string;
  employeeId: string;
}

/** GET /api/sales/{id} — satış detalı + nisyə müştəri adı. */
export interface SaleDetail extends Sale {
  customerName?: string | null;
  /** Kataloq satışında malın cari adı; sərbəstdə / silinibsə null. */
  currentProductName?: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  /** İstəyə bağlı qeyd (API note) */
  note?: string;
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
  /** Sistemə keçid zamanı yazılan ilkin (açılış) borcu. Təmiz başlayan müştəridə 0 */
  initialDebt: number;
  lastPurchaseDate: string;
  lastPaymentDate: string;
  /** Mock tarixçə / sıralama üçün; real API-də də mövcuddur */
  createdAt?: string;
}

/** GET /api/customers/{id}/history — tam borc tarixçəsi */
export interface CustomerHistoryEntry {
  date: string;
  type: "initialDebt" | "sale" | "payment";
  amount: number;
  /** Satışda mal adı (× miqdar); ilkin borc / ödənişdə qeyd mətni */
  note: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  /** İstəyə bağlı qeyd (API note) */
  note?: string;
  totalDebt: number;
  paidAmount: number;
  remainingDebt: number;
  itemCount: number;
  lastPaymentDate: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: "Aktiv" | "Deaktiv";
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  productId: string | null;
  date: string;
  note: string;
}

export interface CustomerPayment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  amount: number;
  date: string;
}

export interface Activity {
  id: string;
  employeeId: string;
  action: string;
  detail: string;
  date: string;
}

export interface Closing {
  id: string;
  date: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  creditSales: number;
  expenses: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
}
