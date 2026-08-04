import { format } from "date-fns";

/** Pul dəyərini təhlükəsiz ədədə çevirir: null / undefined / NaN → 0 */
const toAmount = (value: number | string | null | undefined): number => {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

/** Pul formatı: 1250 → "1,250.00 ₼" */
export const fmtMoney = (value: number | string | null | undefined): string => {
  const formatted = toAmount(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // \u00A0 — qırılmaz boşluq: "₼" rəqəmdən ayrı sətirə düşməsin
  return `${formatted}\u00A0₼`;
};

/**
 * Pul dəyərini 2 onluğa yuvarlaqlaşdırır — float artıqlığını (500 − 300.1 =
 * 199.89999999999998) backend-ə göndərməmək/ekranda göstərməmək üçün.
 */
export const roundMoney = (value: number): number =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

/**
 * Kassa üslubu məbləğ inputu: yalnız rəqəm və TƏK onluq ayırıcı (nöqtə və ya
 * vergül) qəbul edilir — "300,50" → 300.5. Boş, sərbəst mətn ("abc"), mənfi
 * ("-50"), elmi/hex ("1e3", "0x10") kimi dəyərlər `null` qaytarır ki, çağıran
 * tərəf sahəni səhv kimi işarələsin (belə dəyər backend-ə heç vaxt getmir).
 */
export const parseMoneyInput = (raw: string): number | null => {
  const s = raw.trim().replace(",", ".");
  if (s === "" || s === "." || !/^\d*\.?\d*$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? roundMoney(n) : null;
};

/**
 * İşarəli pul formatı (qazanc, fərq və s.):
 * 120 → "+120.00 ₼", -5.5 → "-5.50 ₼", 0 → "+0.00 ₼".
 * Sıfır üçün işarə `zeroSign` ilə seçilir: fmtMoneySigned(0, "±") → "±0.00 ₼".
 */
export const fmtMoneySigned = (
  value: number | string | null | undefined,
  zeroSign: "+" | "±" | "" = "+",
): string => {
  const n = toAmount(value);
  if (n === 0) return `${zeroSign}${fmtMoney(0)}`;
  // Mənfi işarəni toLocaleString özü əlavə edir
  return `${n > 0 ? "+" : ""}${fmtMoney(n)}`;
};

/** Tarix formatı: Date | string | number → "10.07.2026" */
export const fmtDate = (
  value: Date | string | number,
  pattern = "dd.MM.yyyy",
): string => {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
};

/** Sadə unikal identifikator. */
export const uid = (prefix = "id"): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Bugünün ISO tarixi: "2026-07-10" — LOKAL təqvim günü.
 *
 * Əvvəl `toISOString()` (UTC) idi: Bakı UTC+4 olduğuna görə gecə 00:00–04:00
 * arası DÜNƏNİN tarixi qayıdırdı — "Bu gün" filtrləri sürüşür, xərc formasının
 * `max` tarixi isə bugünkü xərci bloklayırdı. Backend də iş gününü Bakı vaxtı
 * ilə hesablayır (`IDateProvider`, Asia/Baku), lokal gün onunla uyğundur.
 */
export const todayISO = (): string => format(new Date(), "yyyy-MM-dd");

/** N gün əvvəlin ISO tarixi (lokal gün, `todayISO` ilə eyni əsasda). */
export const daysAgoISO = (d: number): string => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return format(t, "yyyy-MM-dd");
};

/** Verilmiş ISO tarixdən bu günə qədər keçən gün sayı. */
export const daysBetween = (iso?: string | null): number => {
  if (!iso) return 999;
  return Math.floor(
    (new Date(todayISO()).getTime() - new Date(iso.slice(0, 10)).getTime()) /
      86400000,
  );
};
