import { format } from "date-fns";

/** Pul formatı: 1250 → "1,250.00 AZN" */
export const fmtMoney = (value: number | string | null | undefined): string => {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  const formatted = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} AZN`;
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

/** Bugünün ISO tarixi: "2026-07-10" */
export const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** N gün əvvəlin ISO tarixi. */
export const daysAgoISO = (d: number): string => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString().slice(0, 10);
};

/** Verilmiş ISO tarixdən bu günə qədər keçən gün sayı. */
export const daysBetween = (iso?: string | null): number => {
  if (!iso) return 999;
  return Math.floor(
    (new Date(todayISO()).getTime() - new Date(iso.slice(0, 10)).getTime()) /
      86400000,
  );
};
