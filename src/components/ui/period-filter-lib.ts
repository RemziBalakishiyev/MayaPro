/**
 * PeriodFilter komponentinin xalis (pure) hesablamaları — FE#56.
 *
 * Bu fayl React-dən asılı deyil ki, unit testlərdə asanlıqla (sistem
 * tarixini fake edərək) yoxlanıla bilsin. `todayISO()`/`daysAgoISO()`
 * `new Date()` üzərindən işlədiyi üçün `vi.setSystemTime(...)` ilə
 * bütün funksiyalar avtomatik "cari tarix"i dəyişir — ayrıca parametr
 *ötürməyə ehtiyac yoxdur.
 */
import { daysAgoISO, fmtDate, todayISO } from "@/lib/format";

/** URL-də saxlanılan aralıq — hər ikisi boşdursa "Hamısı" deməkdir. */
export interface PeriodRange {
  from?: string;
  to?: string;
}

export type QuickPeriodKey =
  | "today"
  | "week"
  | "month"
  | "lastMonth"
  | "year"
  | "all";

export const QUICK_PERIODS: { key: QuickPeriodKey; label: string }[] = [
  { key: "today", label: "Bu gün" },
  { key: "week", label: "Bu həftə" },
  { key: "month", label: "Bu ay" },
  { key: "lastMonth", label: "Keçən ay" },
  { key: "year", label: "Bu il" },
  { key: "all", label: "Hamısı" },
];

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Ayın son günü (UTC əsaslı, DST sürüşməsindən qorunmaq üçün). */
const lastDayOfMonth = (y: number, m: number): number =>
  new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Hazır dövr açarından from/to (ISO gün, hər iki sərhəd daxil) aralığı. */
export const quickPeriodRange = (key: QuickPeriodKey): PeriodRange => {
  const to = todayISO();
  switch (key) {
    case "today":
      return { from: to, to };
    case "week":
      return { from: daysAgoISO(6), to };
    case "month":
      return { from: `${to.slice(0, 7)}-01`, to };
    case "lastMonth": {
      let y = Number(to.slice(0, 4));
      let m = Number(to.slice(5, 7)) - 1;
      if (m < 1) {
        m = 12;
        y -= 1;
      }
      const from = `${y}-${pad2(m)}-01`;
      const lastTo = `${y}-${pad2(m)}-${pad2(lastDayOfMonth(y, m))}`;
      return { from, to: lastTo };
    }
    case "year":
      return { from: `${to.slice(0, 4)}-01-01`, to };
    case "all":
    default:
      return {};
  }
};

/**
 * `matchQuickPeriod` üçün tanınma prioritet sırası — `QUICK_PERIODS` (görüntü
 * sırası) İLƏ EYNİ DEYİL, qəsdən.
 *
 * Təqvimə bağlı dövrlər ("Bu ay"/"Keçən ay"/"Bu il", hər zaman ayın/ilin 1-i
 * ilə başlayır) sürüşən (rolling) dövrlərdən ("Bu gün"/"Bu həftə", həmişə
 * bugündən geriyə sabit gün sayı) ÖNCƏ yoxlanılır. Səbəb: bəzi günlərdə iki
 * fərqli açarın hesabladığı aralıq TAM ÜST-ÜSTƏ düşür — məs. ayın 7-də
 * "Bu həftə" (son 7 gün) === "Bu ay" (ayın 1-dən bu günə) və ya yanvarın
 * istənilən günündə "Bu ay" === "Bu il". Əvvəlki sıra (`QUICK_PERIODS`
 * sırası: gün, həftə, ay, keçən ay, il) bu kimi toqquşmalarda həmişə
 * sürüşən dövrü seçirdi (`find` birinci uyğunu qaytarır) — nəticədə
 * istifadəçi "Bu ay" çipinə klikləyəndə `aria-selected` "Bu həftə" çipində
 * qalırdı, "Bu ay" heç vaxt aktiv görünmürdü (FE#174).
 */
const MATCH_PRIORITY: QuickPeriodKey[] = [
  "month",
  "lastMonth",
  "year",
  "today",
  "week",
  "all",
];

/** Verilmiş aralıq hansı hazır çipə uyğun gəlir — heç birinə uyğun gəlmirsə (xüsusi aralıq) `null`. */
export const matchQuickPeriod = (range: PeriodRange): QuickPeriodKey | null => {
  const norm = (r: PeriodRange) => `${r.from ?? ""}|${r.to ?? ""}`;
  const target = norm(range);
  const found = MATCH_PRIORITY.find((key) => norm(quickPeriodRange(key)) === target);
  return found ?? null;
};

export interface MonthOption {
  /** "2026-08" */
  ym: string;
  /** "Avqust 2026" */
  label: string;
}

const AZ_MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
];

/** Son 12 ay — cari aydan başlayaraq geriyə doğru (azalan xronoloji sıra). */
export const last12Months = (): MonthOption[] => {
  const today = todayISO();
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  const out: MonthOption[] = [];
  for (let i = 0; i < 12; i++) {
    out.push({ ym: `${y}-${pad2(m)}`, label: `${AZ_MONTHS[m - 1]} ${y}` });
    m -= 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
  }
  return out;
};

/** "2026-06" → tam ayın aralığı (01-dən son günə qədər). */
export const monthRange = (ym: string): PeriodRange => {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  return { from: `${ym}-01`, to: `${ym}-${pad2(lastDayOfMonth(y, m))}` };
};

/** Çip mətni: "01.06 - 30.06" (gün.ay, il yazılmır — kompakt çip). */
export const formatRangeChip = (from: string, to: string): string =>
  `${fmtDate(from, "dd.MM")} - ${fmtDate(to, "dd.MM")}`;

/** Sərbəst aralıq validasiyası — hər ikisi dolu və başlanğıc son tarixdən sonra olmamalıdır. */
export const validateRange = (from: string, to: string): string | null => {
  if (!from || !to) return "Hər iki tarixi daxil edin";
  if (from > to) return "Başlanğıc tarix son tarixdən sonra ola bilməz";
  return null;
};

/** ISO tarix (gün və ya datetime) verilmiş from/to aralığındadırmı (hər iki sərhəd daxil, boş sərhəd sərhədsizdir). */
export const isoInRange = (iso: string, from?: string, to?: string): boolean => {
  const day = iso.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
};
