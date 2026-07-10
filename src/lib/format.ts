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
