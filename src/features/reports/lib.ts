/** Dashboard və Hesabatlar üçün təmiz (pure) hesablamalar. */
import { productStatus } from "@/features/products/lib";
import { salesMoneySplit } from "@/features/sales/lib";
import { daysBetween, daysAgoISO, fmtDate, todayISO } from "@/lib/format";
import type { Sale, Product, Expense, ProductStatus } from "@/types";

/**
 * Recharts pie/progress rəngləri — kateqoriyalı (qualitative) palet. Xərc
 * kateqoriyaları (`ExpensePie`) əvvəlcədən bilinməyən, dinamik adlardır
 * (Kirayə, İşıq, Nəqliyyat və s.) — buna görə TƏK sabit rəngə bağlanmır,
 * indeks üzrə bu paletdən dövr edir. FE#78 — semantik (sahə mənalı) rənglər
 * üçün bax `REPORT_COLORS` (aşağıda); bu iki palet MƜQSƏD baxımından fərqlidir.
 */
export const PIE_COLORS = [
  "#047857",
  "#b45309",
  "#0369a1",
  "#be123c",
  "#7c3aed",
  "#57534e",
];

/**
 * FE#78 (bənd #13) — bütün Hesabatlar qrafiklərində EYNİ mənalı sahə həmişə
 * EYNİ rəngdə görünsün deyə TƏK yerdə sabitlənən semantik xəritə:
 * satış → emerald, qazanc → fərqli (tund) yaşıl ton, xərc → narıncı,
 * nisyə → amber, kart → mavi, nağd → satışla eyni emerald ton (nağd da satışın
 * bir hissəsidir). Əvvəlki kod bu sahələri müxtəlif komponentlərdə fərqli/
 * səhv toxunmuş hex kodlarla göstərirdi (məs. `PaymentBreakdown`-da "Kart"
 * indeks-1 rəngi ilə, "Nisyə" indeks-2 rəngi ilə — nəticədə kart narıncı,
 * nisyə göy görünürdü, bu xəritədəki qayda ilə TƏRS idi). Yalnız TƏQDİMAT
 * (rəng) dəyişikliyidir — heç bir dəyər/hesablama toxunulmayıb.
 */
export const REPORT_COLORS = {
  sales: "#047857", // emerald-700 — satış
  cash: "#047857", // nağd (satışın faktiki alınan hissəsi) — satışla eyni ton
  profit: "#0f766e", // teal-700 — qazanc (satışdan fərqli, aydın ayrılan yaşıl ton)
  expense: "#c2410c", // orange-700 — xərc (narıncı)
  credit: "#b45309", // amber-700 — nisyə
  card: "#2563eb", // blue-600 — kart
} as const;

export type ReportColorKey = keyof typeof REPORT_COLORS;

export const sumBy = <T>(arr: T[], f: (x: T) => number): number =>
  arr.reduce((a, x) => a + f(x), 0);

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ProductWithStatus extends Product {
  status: ProductStatus;
  lastSaleDate: string | null;
}

export interface FrozenProduct extends ProductWithStatus {
  idleDays: number;
  frozenValue: number;
  /** Heç satılmayıb (server daysSinceLastSale=null). Yoxdursa idleDays etibarlıdır. */
  neverSold?: boolean;
}

/** productId → sonuncu satış tarixi. */
export const lastSaleMap = (sales: Sale[]): Record<string, string> => {
  const m: Record<string, string> = {};
  sales.forEach((s) => {
    if (!s.productId) return; // sərbəst satış — katalog malı yoxdur
    if (!m[s.productId] || s.createdAt > m[s.productId]) m[s.productId] = s.createdAt;
  });
  return m;
};

export const withStatus = (
  products: Product[],
  sales: Sale[],
): ProductWithStatus[] => {
  const last = lastSaleMap(sales);
  return products.map((p) => ({
    ...p,
    status: productStatus(p, last[p.id]),
    lastSaleDate: last[p.id] ?? null,
  }));
};

/** Azalan/bitən stok: quantity ≤ minStock. */
export const lowStockProducts = (products: Product[]): Product[] =>
  products.filter((p) => p.quantity <= p.minStock);

/** Dondurulmuş mallar: son satışından 30+ gün keçən və stokda olanlar. */
export const frozenProducts = (
  products: Product[],
  sales: Sale[],
): FrozenProduct[] => {
  const last = lastSaleMap(sales);
  return withStatus(products, sales)
    .map((p) => ({
      ...p,
      idleDays: daysBetween(last[p.id] ?? p.createdAt),
      frozenValue: p.realCostPerUnit * p.quantity,
    }))
    .filter((p) => p.idleDays >= 30 && p.quantity > 0);
};

export interface TopProduct {
  product: Product;
  qty: number;
}

/** Satış sayına görə mallar (çoxdan aza). */
export const topProductsByQty = (
  sales: Sale[],
  products: Product[],
): TopProduct[] => {
  const byId: Record<string, number> = {};
  sales.forEach((s) => {
    if (!s.productId) return; // sərbəst satış — katalog malı yoxdur
    byId[s.productId] = (byId[s.productId] ?? 0) + s.quantity;
  });
  return Object.entries(byId)
    .map(([pid, qty]) => ({
      product: products.find((p) => p.id === pid),
      qty,
    }))
    .filter((x): x is TopProduct => !!x.product)
    .sort((a, b) => b.qty - a.qty);
};

export interface DailyPoint {
  /** Ox etiketi — "01.08" (gün.ay, il yazılmır — FE#78 bənd #5). */
  date: string;
  /**
   * FE#78 (bənd #9) — tooltip-də TAM tarix göstərmək üçün (ox etiketi
   * qısaldılmış olduğu üçün il məlumatı itir). Yalnız TƏQDİMAT sahəsidir,
   * `satis`/`qazanc` hesablamasına təsir etmir.
   */
  fullDateIso: string;
  satis: number;
  qazanc: number;
  /**
   * FE#78 (bənd #9) — tooltip sxemi "tarix · satış · qazanc · xərc" tələb
   * edir. Xərc qeydləri (`Expense.date`) artıq gündəlik satış/qazanc ilə
   * EYNİ üsulla (həmin günün ISO tarixinə görə filtr + cəm) qruplaşdırılır —
   * bu, `satis`/`qazanc` üçün onsuz da mövcud olan naxışın təkrarıdır, YENİ
   * hesablama MƏNTİQİ deyil. `expenses` ötürülmədikdə (Dashboard-un köhnə
   * çağırışı, bax `queries.ts`) `undefined` qalır — geriyə uyğun.
   */
  xerc?: number;
}

/** Günlük satış+qazanc(+xərc) seriyası (son N gün). */
export const dailySeries = (
  sales: Sale[],
  days = 14,
  expenses?: Expense[],
): DailyPoint[] => {
  const out: DailyPoint[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const iso = daysAgoISO(d);
    const ds = sales.filter((s) => s.createdAt.slice(0, 10) === iso);
    const point: DailyPoint = {
      date: fmtDate(iso).slice(0, 5),
      fullDateIso: iso,
      satis: round2(sumBy(ds, (s) => s.totalAmount)),
      qazanc: round2(sumBy(ds, (s) => s.profit ?? 0)),
    };
    if (expenses) {
      const es = expenses.filter((e) => e.date.slice(0, 10) === iso);
      point.xerc = round2(sumBy(es, (e) => e.amount));
    }
    out.push(point);
  }
  return out;
};

export interface WeekPoint {
  /** Köhnə qısa açar — daxili sıralama/açar üçün saxlanılır, EKRANDA göstərilmir. */
  week: string;
  /**
   * FE#78 (bənd #6) — ekranda göstərilən oxunan etiket: "28.07 – 03.08"
   * formatında REAL tarix aralığı ("H1"/"H2" kimi qeyri-müəyyən açarlar
   * ƏVƏZ OLUNUR). Data (`qazanc`) dəyişməyib — yalnız etiket formatlaması.
   */
  label: string;
  qazanc: number;
}

/** Həftəlik qazanc trendi (son N həftə). */
export const weeklySeries = (sales: Sale[], weeks = 6): WeekPoint[] => {
  const out: WeekPoint[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const from = daysAgoISO((w + 1) * 7 - 1);
    const to = daysAgoISO(w * 7);
    const ws = sales.filter((s) => {
      const d = s.createdAt.slice(0, 10);
      return d >= from && d <= to;
    });
    out.push({
      week: `H${weeks - w}`,
      label: `${fmtDate(from, "dd.MM")} – ${fmtDate(to, "dd.MM")}`,
      qazanc: Math.round(sumBy(ws, (s) => s.profit ?? 0)),
    });
  }
  return out;
};

/**
 * FE#78 (bənd #11) — bir seriyada nə qədər SIFIRDAN FƏRQLİ nöqtə olduğunu
 * sayır. Seyrək data (0 və ya 1 nöqtə) üçün böyük, əksər hissəsi boş olan
 * qrafik ƏVƏZİNƏ aydın "kifayət qədər məlumat yoxdur" mesajı göstərilir —
 * bax `MIN_CHART_POINTS`. Xalis (pure) funksiya, heç bir hesablamaya
 * TOXUNMUR — yalnız artıq mövcud olan dəyərləri sayır.
 */
export const nonZeroCount = <T>(data: T[], pick: (x: T) => number): number =>
  data.filter((x) => pick(x) !== 0).length;

/** FE#78 (bənd #11) — "seyrək data" həddi: 2-dən az qeyri-sıfır nöqtə. */
export const MIN_CHART_POINTS = 2;

export interface MonthPoint {
  month: string;
  qazanc: number;
}

/** Aylıq qazanc seriyası (son N ay). */
export const monthlySeries = (sales: Sale[], months = 6): MonthPoint[] => {
  const [yStr, mStr] = todayISO().split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  const list: { y: number; m: number }[] = [];
  for (let i = 0; i < months; i++) {
    list.push({ y, m });
    m--;
    if (m < 1) {
      m = 12;
      y--;
    }
  }
  list.reverse();
  return list.map(({ y, m }) => {
    const ym = `${y}-${String(m).padStart(2, "0")}`;
    const ms = sales.filter((s) => s.createdAt.slice(0, 7) === ym);
    return {
      month: `${String(m).padStart(2, "0")}.${String(y).slice(2)}`,
      qazanc: Math.round(sumBy(ms, (s) => s.profit ?? 0)),
    };
  });
};

export interface NamedValue {
  name: string;
  value: number;
}

/** Xərc kateqoriya bölgüsü. */
export const expenseByCategory = (expenses: Expense[]): NamedValue[] => {
  const byCat: Record<string, number> = {};
  expenses.forEach((e) => {
    byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
  });
  return Object.entries(byCat).map(([name, value]) => ({ name, value }));
};

/**
 * Ödəniş növü bölgüsü (Nağd/Kart/Nisyə) — faktiki daxil olan pula görə
 * (BE#19 qaydası): qismən ödənilmiş satışın nağd/kart hissəsi öz səbətinə,
 * yalnız ödənilməmiş qalıq isə "Nisyə"yə düşür. Cəm dövrün satış yekununa
 * bərabər qalır.
 */
export const paymentBreakdown = (sales: Sale[]): NamedValue[] => {
  const { cash, card, credit } = salesMoneySplit(sales);
  return [
    { name: "Nağd", value: cash },
    { name: "Kart", value: card },
    { name: "Nisyə", value: credit },
  ];
};

/** Ziyana satılan mallar (satış qiyməti real mayadan aşağı). */
export const lossSellers = (products: Product[]): Product[] =>
  products.filter((p) => p.salePrice < p.realCostPerUnit);

export type Period = "today" | "week" | "month" | "year" | "all";

/**
 * "Bu il"siz dövr dəsti — Satış, Borclar və Hesabatlar səhifələrinin URL
 * sxemləri (z.enum) yalnız bu 4 dəyəri qəbul edir; "year" hazırda Xərclər
 * səhifəsinə məxsusdur. Tab siyahıları bu tiplə yazılır ki, `navigate`
 * çağırışları route sxemi ilə uyğun qalsın.
 */
export type BasePeriod = Exclude<Period, "year">;

export const PERIOD_LABELS: Record<Period, string> = {
  today: "Bu gün",
  week: "Bu həftə",
  month: "Bu ay",
  year: "Bu il",
  all: "Hamısı",
};

/**
 * ISO tarix seçilmiş dövrə düşürmü. Backend `ReportPeriod` ilə eyni pəncərələr —
 * hamısı BU GÜNLƏ bitir, hər iki sərhəd daxildir:
 * - "today" → yalnız bu gün;
 * - "week"  → son 7 gün (bu gün daxil), backend `today.AddDays(-6)..today`;
 * - "month" → təqvim ayının 1-i … bu gün, backend `new DateOnly(y, m, 1)..today`;
 * - "year"  → cari ilin 1 yanvarı … bu gün (Xərclər səhifəsinin "Bu il" dövrü);
 * - "all"   → sərhədsiz.
 *
 * "month" əvvəllər "son 30 gün" (`daysBetween <= 29`) idi — bu, ay sərhədində
 * Hesabatlar və Xərclər səhifələrindəki rəqəmlərin fərqlənməsinə səbəb olurdu
 * (FE#9). İndi PERIOD_LABELS-dəki "Bu ay" mətni ilə də üst-üstə düşür və Xərclər
 * səhifəsinin `input[type=month]` filtri ilə eyni ayı əhatə edir.
 *
 * "week"/"month" əvvəl gələcək tarixli qeydi də sayırdı (backend saymır) —
 * mock rejimdə `mockSummary` bu funksiya üzərindən işlədiyi üçün Hesabatlar
 * səhifəsi Xərclər səhifəsindən BÖYÜK "Xərc" göstərirdi (FE#11). İndi yuxarı
 * sərhəd hər iki dövr üçün bu gündür.
 *
 * `iso` "YYYY-MM-DD" və ya ISO datetime ola bilər → gün hissəsi kəsilir; ISO
 * formatda leksikoqrafik müqayisə xronoloji müqayisə ilə eynidir.
 */
export const inPeriod = (iso: string, period: Period): boolean => {
  const day = iso.slice(0, 10);
  const today = todayISO();
  switch (period) {
    case "today":
      return day === today;
    case "week": {
      const diff = daysBetween(day);
      return diff >= 0 && diff <= 6;
    }
    case "month":
      return day.slice(0, 7) === today.slice(0, 7) && day <= today;
    case "year":
      return day.slice(0, 4) === today.slice(0, 4) && day <= today;
    case "all":
    default:
      return true;
  }
};
