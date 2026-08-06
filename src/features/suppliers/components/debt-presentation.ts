import { daysBetween } from "@/lib/format";
import { TONE_TEXT } from "@/lib/ui-tokens";
import type { Supplier } from "@/types";

/**
 * FE#75 — "Mənim borcum" (təchizatçıya) rənginin TƏQDİMAT qaydası.
 *
 * Bu modul `src/features/customers/components/debt-presentation.ts`
 * (FE#73) ilə EYNİ naxışdır — "Nisyə Borclar/Müştərilər"dəki qayda buraya
 * bit-bədit köçürülüb, YALNIZ mənbə tipi `Customer` → `Supplier` dəyişib.
 * Modul YALNIZ görünüşü təyin edir. `remainingDebt`/`lastPaymentDate`/
 * `createdAt` kimi mövcud sahələrə/hesablamalara TOXUNULMUR.
 *
 * Qayda (PM tələbi, FE#75 "Rəng qaydası xatırlatması" + FE#73 bənd 9):
 * - borc yoxdur (`remainingDebt <= 0`)          → "none" (təmiz)
 * - borc var, 60 gündən AZ hərəkətsiz           → "normal" (neytral/tünd)
 * - borc var, 60–119 gün hərəkətsiz             → "overdue" (kəhrəba/narıncı)
 * - borc var, 120+ gün hərəkətsiz               → "critical" (qırmızı,
 *   YALNIZ bu ən ağır tərzdə)
 *
 * "Hərəkətsizlik yaşı": son ödəniş tarixi, o da yoxdursa təchizatçının
 * yaradılma tarixi. **Diqqət (Customer modulundan fərq):** `Supplier`
 * tipində `Customer.lastPurchaseDate`-ə ekvivalent bir sahə (son borc
 * əlavəsi/alış tarixi) YOXDUR — backend `SupplierDto` bunu ayrıca
 * qaytarmır (bax `src/features/suppliers/api.ts` başlığındakı şərh).
 * Ona görə yaş YALNIZ son ödəniş / yaradılma tarixindən hesablanır — bu,
 * "borc nə vaxtdan hərəkətsizdir" sualına Customer modulundan bir az daha
 * kobud (approximation) cavabdır (məs. son ödənişdən sonra yeni borc
 * əlavə olunubsa, həmin YENİ borcun yaşı deyil, son ödənişin yaşı
 * göstərilir). Heç bir tarix yoxdursa (nadir/köhnə data), yaş NAMƏLUM
 * sayılır və ən sakit ("normal") tona düşür — məlumat çatışmazlığı
 * YANLIŞLIQLA "kritik" kimi göstərilməsin deyə.
 */
export type DebtTone = "none" | "normal" | "overdue" | "critical";

const OVERDUE_DAYS = 60;
const CRITICAL_DAYS = 120;

export function debtAgeDays(
  s: Pick<Supplier, "lastPaymentDate" | "createdAt">,
): number | null {
  const ref = s.lastPaymentDate || s.createdAt;
  return ref ? daysBetween(ref) : null;
}

export function debtTone(
  remainingDebt: number,
  ageDays: number | null,
): DebtTone {
  if (remainingDebt <= 0) return "none";
  if (ageDays != null && ageDays >= CRITICAL_DAYS) return "critical";
  if (ageDays != null && ageDays >= OVERDUE_DAYS) return "overdue";
  return "normal";
}

/**
 * Badge mətni/açarı — `src/components/ui/Badge.tsx`-dəki mövcud
 * `Borclu`/`Gecikmiş borc`/`Kritik borc`/`Ödənilib` tonları YENİDƏN
 * istifadə olunur (FE#73 ilə artıq qeyri-kritik/sakit tona keçirilib) —
 * `Badge.tsx`-ə heç bir dəyişiklik lazım deyil.
 */
export const DEBT_TONE_LABEL: Record<DebtTone, string> = {
  none: "Ödənilib",
  normal: "Borclu",
  overdue: "Gecikmiş borc",
  critical: "Kritik borc",
};

/** Cədvəl/mobil kart rəqəmi — kompakt kontekstdə sıfır sakit boz. */
export const DEBT_NUMBER_CLASS: Record<DebtTone, string> = {
  none: "text-stone-500",
  normal: "text-stone-800",
  overdue: TONE_TEXT.warning,
  critical: TONE_TEXT.danger,
};

/** Detal draverindəki böyük başlıq rəqəmi — təmiz halda təsdiqləyici yaşıl saxlanılır. */
export const DEBT_HEADLINE_CLASS: Record<DebtTone, string> = {
  none: "text-emerald-700",
  normal: "text-stone-800",
  overdue: TONE_TEXT.warning,
  critical: TONE_TEXT.danger,
};

/** Detal draverindəki "Cari borcum" panelinin arxa fon/çərçivə tonu. */
export const DEBT_PANEL_CLASS: Record<DebtTone, string> = {
  none: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
  normal: "border-stone-200 bg-gradient-to-br from-stone-50 to-white",
  overdue: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
  critical: "border-red-100 bg-gradient-to-br from-red-50 to-white",
};
