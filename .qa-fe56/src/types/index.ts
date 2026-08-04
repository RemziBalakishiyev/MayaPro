/** Modullar arası paylaşılan ortaq tiplər. */

export type PaymentType = "Nağd" | "Kart" | "Nisyə";

export type ProductStatus =
  | "Stokda var"
  | "Azalır"
  | "Bitib"
  | "Satılmır"
  | "Ziyana satılır";

/**
 * Xərc mənbəyi: "general" — satışa bağlı olmayan ümumi xərc (mala təsir etmir);
 * "product" — malın mayasına əlavə olunan xərc (productId mütləqdir).
 */
export type ExpenseSource = "general" | "product";

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

/** Mərkəzi xərc növü (məs. "Yol pulu", "Mağaza xərci", "İşçi pulu") — GET/POST /api/expense-types. */
export interface ExpenseType {
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
  /**
   * BE#15 — qismən ödənişli satış: faktiki ödənilən məbləğ (tam ödəmədə
   * `totalAmount`-a bərabər, nisyədə 0 ola bilər).
   */
  paidAmount: number;
  /** `totalAmount − paidAmount` (tam ödəmədə 0). */
  remainingAmount: number;
  /**
   * Ödənilən hissənin necə alındığı (Nağd/Kart) — yalnız `remainingAmount > 0`
   * olduqda `paymentType`-dan fərqli məna daşıyır (qismən ödənişli nisyə).
   */
  paidVia: PaymentType;
  /** Satış anındakı real maya snapshot-u (1 ədəd); manual satışda maya bilinmirsə null. */
  costPerUnit?: number | null;
  /** Malın vahid alış qiyməti (satış anındakı snapshot); bilinmirsə null. */
  purchasePricePerUnit?: number | null;
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
  /** Bütün satışların (nağd + kart + nisyə) yekun cəmi. */
  totalPurchases: number;
  /** Bütün satışların sayı. */
  purchaseCount: number;
  /** Son alışın tarixi — ödəniş növündən asılı olmayaraq. */
  lastPurchaseDate: string;
  lastPaymentDate: string;
  /** Mock tarixçə / sıralama üçün; real API-də də mövcuddur */
  createdAt?: string;
}

/** GET /api/customers/{id}/history — tam alış / borc / ödəniş tarixçəsi */
export interface CustomerHistoryEntry {
  date: string;
  type: "initialDebt" | "sale" | "payment";
  amount: number;
  /** Satışda mal adı (× miqdar); ilkin borc / ödənişdə qeyd mətni */
  note: string | null;
  /** type === "sale" üçün — DELETE /api/customers/{id}/credits/{saleId} (yalnız nisyədə) */
  saleId?: string | null;
  /** type === "sale" üçün ödəniş növü; yalnız Nisyə borcu artırır */
  paymentType?: PaymentType | null;
}

/**
 * GET /api/customers/open-debts (BE#21) — bir sətir = bir müştərinin bir açıq
 * (hələ tam ödənilməmiş) borc mənbəyi: ilkin borc və ya qalıqlı satış. Ödənişlər
 * FIFO qaydası ilə ən köhnə mənbədən silinir; `remaining=0` olan mənbələr
 * siyahıya düşmür.
 */
export interface OpenDebt {
  customerId: string;
  customerName: string;
  phone: string | null;
  source: "initialDebt" | "sale";
  sourceDate: string;
  description: string;
  originalAmount: number;
  paidSoFar: number;
  remaining: number;
  /** Bakı iş günü ilə mənbə tarixindən bu günə qədər keçən gün sayı (mənfi olmur). */
  daysOld: number;
}

/** GET /api/customers/open-debts cavabı — sətirlər + hamısının qalıq cəmi. */
export interface OpenDebtsResponse {
  items: OpenDebt[];
  totalRemaining: number;
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
  /**
   * Sistemə keçid zamanı yazılan ilkin (açılış) borcu.
   * ⚠️ Yalnız mock rejimdə etibarlıdır: real `SupplierDto` bu sahəni ayrıca
   * qaytarmır (ilkin borc `debt`-in içindədir) → real rejimdə həmişə 0 olur.
   * İlkin borc sətrini göstərmək üçün `useSupplierHistory` istifadə edin.
   */
  initialDebt: number;
  itemCount: number;
  lastPaymentDate: string;
  /** Mock tarixçə / sıralama üçün; real API-də də mövcuddur */
  createdAt?: string;
}

/**
 * GET /api/suppliers/{id}/history — ilkin borc + ödəniş tarixçəsi.
 * Sıra xronolojidir (köhnədən yeniyə); ilkin borc həmişə birinci sətirdir.
 */
export interface SupplierHistoryEntry {
  date: string;
  type: "initialDebt" | "payment";
  amount: number;
  /** İlkin borc / ödənişdə qeyd mətni */
  note: string | null;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: "Aktiv" | "Deaktiv";
  /** BE#28 — razılaşılmış aylıq maaş (0 = hələ təyin olunmayıb). Additiv sahə. */
  monthlySalary?: number;
}

/** BE#28 — maaş əməliyyatının növü: "payment" kassadan çıxır, "deduction" yalnız hesabdan tutulur. */
export type SalaryEntryType = "payment" | "deduction";

/**
 * Bir işçinin bir ay üçün maaş vəziyyəti (GET /api/employees/salary-summary).
 * `remaining = monthlySalary − paidTotal − deductionTotal`, mənfi ola bilər
 * (artıq veriliş deməkdir).
 */
export interface EmployeeSalarySummary {
  userId: string;
  fullName: string;
  role: string;
  monthlySalary: number;
  paidTotal: number;
  deductionTotal: number;
  remaining: number;
}

/** Maaş hesabının bir sətri (GET/POST /api/employees/{id}/salary-entries). */
export interface SalaryEntry {
  id: string;
  userId: string;
  type: SalaryEntryType;
  amount: number;
  note: string | null;
  /** Pulun hərəkət etdiyi tarix (ödənişdə gün sonuna düşür). */
  date: string;
  /** Mühasibat ayı "yyyy-MM" — hansı ayın hesabına yazılır. */
  month: string;
  createdByUserId: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  title: string;
  /** Mərkəzi xərc növləri siyahısından seçilən ad (sərbəst mətn, əvvəlki sabit enum əvəzinə). */
  category: string;
  amount: number;
  productId: string | null;
  date: string;
  note: string;
  /** Ümumi (satışa bağlı olmayan) və ya mala bağlı xərc. */
  source: ExpenseSource;
  /**
   * Xərci yazan istifadəçinin id-si (backend `ExpenseDto.createdByUserId`) —
   * detal drawerindəki "Kim yazıb" sətri üçün. Mock rejimdə və köhnə
   * cavablarda yoxdur → UI "Naməlum" göstərir.
   */
  createdByUserId?: string | null;
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
