import { DEFAULT_WA_TEMPLATE } from "@/features/settings/store";
import type { Customer } from "@/types";

/**
 * WhatsApp borc xatırlatma linki.
 * Telefon `\D` təmizlənir; şablondakı {debt} borc məbləği ilə əvəzlənir.
 */
export const waLink = (
  phone: string,
  debt: number,
  template: string = DEFAULT_WA_TEMPLATE,
): string => {
  const clean = (phone || "").replace(/\D/g, "");
  const text = (template || DEFAULT_WA_TEMPLATE).replace(
    "{debt}",
    debt.toFixed(2),
  );
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};

/**
 * FE#74 (AC8/AC9) — "Borclar" görünüşündəki (`OpenDebtsTable`) hər açıq borc
 * MƏNBƏYİNİN (`OpenDebt.daysOld`) yaşına görə ciddilik həddləri. Yeni biznes
 * qaydası DEYİL — mövcud `daysOld` sahəsinin TƏQDİMAT (rəng/vurğu) həddidir,
 * bir yerdə konfiqurasiya oluna bilən sabitlərdir. Heç bir backend/API
 * çağırışı əlavə olunmayıb.
 *
 * DİQQƏT: bu, `debt-presentation.ts`-dəki müştəri-üzrə CƏM borc yaşı
 * həddlərindən (`OVERDUE_DAYS=60`/`CRITICAL_DAYS=120`) FƏRQLİDİR — həmin
 * modul "Müştəri üzrə" görünüşünə (`CustomersTable`/`CustomerDrawer`) aiddir,
 * bu isə mənbə-üzrə "Borclar" görünüşünə. İkisi qəsdən ayrı saxlanılıb, çünki
 * mənbə-üzrə dəqiq yaş (`daysOld`) ilə müştəri-üzrə cəm hərəkətsizlik yaşı
 * fərqli mənalar daşıyır.
 */
export const DEBT_AGE_WARN = 30;
export const DEBT_AGE_CRITICAL = 60;

export type DebtAgeTone = "neutral" | "warn" | "critical";

/** `daysOld` → ciddilik pilləsi (AC8: təzə → neytral, köhnə → xəbərdarlıq, çox köhnə → kritik). */
export function debtAgeTone(daysOld: number): DebtAgeTone {
  if (daysOld >= DEBT_AGE_CRITICAL) return "critical";
  if (daysOld >= DEBT_AGE_WARN) return "warn";
  return "neutral";
}

/**
 * FE#74 (AC13/AC14) — `PaymentModal` "Ödəniş al" ilə "Borclar" cədvəlindən
 * açılanda hansı borc mənbəyindən (mal adı/tarix) gəldiyini göstərmək üçün.
 * "Müştəri üzrə" rejimindən / `CustomerDrawer`-dən açılanda ötürülmür (AC14
 * — modal bu sətirsiz, xətasız açılır).
 */
export interface DebtPaymentContext {
  description: string;
  sourceDate: string;
}

/**
 * FE#74 (AC5, TC10-TC12) — KPI panelindəki "Ən çox borclu" mini-kartına klik
 * ediləndə `topDebtor.name`-ə (KPI endpoint-i `customerId` qaytarmır) görə
 * onsuz da yüklənmiş `customers` siyahısında DƏQİQ və BİRQİYMƏTLİ uyğun
 * müştəri axtarılır. Tam BİR uyğun müştəri varsa — o qaytarılır (çağıran
 * `CustomerDrawer`-i açır). Heç biri uyğun gəlmirsə (silinib/ad fərqlidir)
 * VƏ YA birdən çoxu uyğun gəlirsə (ad üst-üstə düşür, birqiymətli deyil) —
 * `null` qaytarılır (çağıran FE#63-dəki fallback-a keçir: axtarışı ad ilə
 * doldurur). Bu funksiya təcrid olunub ki, ad-uyğunluq qaydası (unit testlə)
 * müstəqil yoxlanıla bilsin.
 */
export function findUniqueCustomerByName(
  customers: Customer[],
  name: string,
): Customer | null {
  const matches = customers.filter((c) => c.name === name);
  return matches.length === 1 ? matches[0] : null;
}
