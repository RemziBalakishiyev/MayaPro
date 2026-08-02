/** Maaş bölməsi (BE#28) üçün təmiz (pure) köməkçilər. */
import { todayISO } from "@/lib/format";

/** Cari mühasibat ayı "yyyy-MM" — backend `SalaryMonth.From(today)` ilə eyni əsas. */
export const currentSalaryMonth = (): string => todayISO().slice(0, 7);

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

/** "2026-08" → "Avqust 2026". Etibarsız girişdə xam dəyəri qaytarır. */
export const formatSalaryMonth = (month: string): string => {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${AZ_MONTHS[m - 1]} ${y}`;
};

/** Ayı bir addım irəli/geri sürüşdürür: "2026-01" − 1 → "2025-12". */
export const shiftSalaryMonth = (month: string, delta: number): string => {
  const [yStr, mStr] = month.split("-");
  let y = Number(yStr);
  let m = Number(mStr) + delta;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
};

/** Cari aydan sonrakı aya keçidi bloklamaq üçün — maaş tarixçəsi gələcəyə açılmır. */
export const isFutureSalaryMonth = (month: string): boolean =>
  month > currentSalaryMonth();

/** "Tutulma yaz" modalındakı hazır səbəb seçimləri — sərbəst qeydlə tamamlanır. */
export const DEDUCTION_REASONS = ["Yemək", "Yol", "Cərimə", "Digər"] as const;
export type DeductionReason = (typeof DEDUCTION_REASONS)[number];

/**
 * Səbəb seçimi + sərbəst qeydi backend-in tək `note` sahəsinə birləşdirir.
 * "Digər" seçiləndə sərbəst mətn məcburidir və eynən özü `note` olur;
 * digər hallarda seçim adı əsas götürülür, sərbəst mətn varsa "—" ilə əlavə olunur.
 */
export const composeDeductionNote = (
  reason: DeductionReason,
  freeText: string,
): string => {
  const extra = freeText.trim();
  if (reason === "Digər") return extra;
  return extra ? `${reason} — ${extra}` : reason;
};

/** Proqres zolağı üçün 0–100 aralığına sıxılmış faiz (maaş 0-dırsa 0). */
export const salaryProgressPercent = (paid: number, salary: number): number => {
  if (!(salary > 0)) return 0;
  return Math.max(0, Math.min(100, (paid / salary) * 100));
};
