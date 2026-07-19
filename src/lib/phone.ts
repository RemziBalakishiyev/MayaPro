const COUNTRY_CODE = "994";
const LOCAL_LEN = 9;

/** Yalnız rəqəmlər. */
export function phoneDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Saxlanılan və ya yapışdırılan nömrədən yerli 9 rəqəmi çıxarır.
 * 994..., +994..., 050... qəbul edir.
 */
export function toLocalPhoneDigits(value: string): string {
  let digits = phoneDigits(value);
  if (digits.startsWith(COUNTRY_CODE)) digits = digits.slice(COUNTRY_CODE.length);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, LOCAL_LEN);
}

/** Ekran formatı: 50 123 45 67 */
export function formatLocalPhone(local: string): string {
  const d = toLocalPhoneDigits(local);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

/** API / WhatsApp üçün: "994501234567" və ya boş. */
export function toStoredPhone(value: string): string {
  const local = toLocalPhoneDigits(value);
  return local ? `${COUNTRY_CODE}${local}` : "";
}

/** Ekran üçün: "+994 50 123 45 67" və ya boş. */
export function formatPhoneDisplay(value: string): string {
  const local = toLocalPhoneDigits(value);
  if (!local) return "";
  return `+${COUNTRY_CODE} ${formatLocalPhone(local)}`;
}
