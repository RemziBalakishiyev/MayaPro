import { daysBetween } from "@/lib/format";
import { TONE_TEXT } from "@/lib/ui-tokens";
import type { Customer } from "@/types";

/**
 * FE#73 — borc rənginin TƏQDİMAT qaydası (dizayn sistemi 9-cu qayda: rəng
 * heç vaxt yeganə status siqnalı deyil — mətn/badge ilə də fərqlənməlidir).
 *
 * Bu modul YALNIZ görünüşü təyin edir. `remainingDebt`, `lastPaymentDate`,
 * `lastPurchaseDate` kimi mövcud sahələrə/hesablamalara TOXUNULMUR — burada
 * yalnız artıq mövcud olan dəyərlər necə RƏNGLƏNDİRİLƏCƏYİ təyin olunur
 * (bax `src/features/day-end/components/cash-diff-presentation.ts` — eyni
 * naxış).
 *
 * Qayda (PM tələbi, bənd 9):
 * - borc yoxdur (`remainingDebt <= 0`)          → "none" (təmiz)
 * - borc var, 60 gündən AZ hərəkətsiz           → "normal" (neytral/tünd)
 * - borc var, 60–119 gün hərəkətsiz             → "overdue" (kəhrəba/narıncı)
 * - borc var, 120+ gün hərəkətsiz               → "critical" (qırmızı,
 *   YALNIZ bu ən ağır tərzdə)
 *
 * "Hərəkətsizlik yaşı": son ödəniş tarixi, yoxdursa son alış tarixi, o da
 * yoxdursa müştərinin yaradılma tarixi. Heç biri yoxdursa (köhnə/natamam
 * mock data), yaş NAMƏLUM sayılır və ən sakit ("normal") rəngə düşür ki,
 * məlumat çatışmazlığı səhvən "kritik" kimi işarələnməsin.
 *
 * Qeyd: bu, müştəri-üzrə CƏM borcun yaşıdır (mənbə-üzrə DƏQİQ yaş deyil —
 * mənbə-üzrə `daysOld` yalnız `GET /api/customers/open-debts`-dəki `OpenDebt`
 * sətirlərində mövcuddur və "Nisyə Borclar → Borclar" görünüşündə
 * (`OpenDebtsTable`, dəyişməyib) artıq öz rəng qaydası ilə göstərilir).
 */
export type DebtTone = "none" | "normal" | "overdue" | "critical";

const OVERDUE_DAYS = 60;
const CRITICAL_DAYS = 120;

export function debtAgeDays(
  c: Pick<Customer, "lastPaymentDate" | "lastPurchaseDate" | "createdAt">,
): number | null {
  const ref = c.lastPaymentDate || c.lastPurchaseDate || c.createdAt;
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

/** Badge mətni/açarı (`Badge` tone açarı kimi də istifadə olunur). */
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

/** Detal draverindəki böyük başlıq rəqəmi — təmiz halda təsdiqləyici yaşıl saxlanılır (dəyişməyib). */
export const DEBT_HEADLINE_CLASS: Record<DebtTone, string> = {
  none: "text-emerald-700",
  normal: "text-stone-800",
  overdue: TONE_TEXT.warning,
  critical: TONE_TEXT.danger,
};

/** Detal draverindəki "Qalıq borc" panelinin arxa fon/çərçivə tonu. */
export const DEBT_PANEL_CLASS: Record<DebtTone, string> = {
  none: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
  normal: "border-stone-200 bg-gradient-to-br from-stone-50 to-white",
  overdue: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
  critical: "border-red-100 bg-gradient-to-br from-red-50 to-white",
};
