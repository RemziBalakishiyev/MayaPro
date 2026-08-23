/**
 * FE#190 — login cəhdi zamanı yazılan telefon nömrəsinin müvəqqəti körpüsü.
 *
 * `/hesab-bloklu` (PendingApproval) ekranına keçid `lib/api-client.ts`-dəki
 * `handleAccessBlocked` vasitəsilə TAM SƏHİFƏ yönləndirməsi (`window.location.assign`)
 * ilə baş verir — bu zaman login formunun React state-i itir. Ona görə
 * göndərilən telefon submit anında sessionStorage-a yazılır, pending
 * ekranında oradan oxunur ki, WhatsApp bildiriş mesajında istifadəçinin öz
 * nömrəsi görünsün.
 */
const KEY = "sederek-last-login-phone";

/** Login submit-i zamanı çağırılır — cəhd edilən telefonu yadda saxlayır. */
export function rememberLastLoginPhone(phone: string): void {
  try {
    sessionStorage.setItem(KEY, phone);
  } catch {
    // yaddaş əlçatan deyil (məs. gizli rejim) — sükutla keç.
  }
}

/** Pending ekranında oxunur. Yaddaşda yoxdursa boş sətir qaytarır. */
export function getLastLoginPhone(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
