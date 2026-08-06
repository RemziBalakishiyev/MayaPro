import type { SemanticTone } from "@/lib/ui-tokens";

/**
 * FE#69 (AC-12 / R-02) — kassa fərqinin TƏQDİMAT qaydası.
 *
 * Bu modul YALNIZ görünüşü təyin edir; `difference()` və `expectedCash()`
 * düsturlarına (`features/day-end/lib.ts`) toxunulmur.
 *
 * Qayda:
 * - `diff < 0`  → çatışmazlıq: qırmızı (danger)
 * - `diff > 0`  → ARTIQ məbləğ də uyğunsuzluqdur: kəhrəba (warning) —
 *                 yaşıl «uğur» DEYİL
 * - `diff === 0`→ kassa düz gəlib: yaşıl (success)
 */
export type CashDiffTone = Extract<
  SemanticTone,
  "success" | "warning" | "danger"
>;

export interface CashDiffPresentation {
  tone: CashDiffTone;
  /** Qısa izah — `title`/alt sətir üçün. */
  title: string;
  /** Xəbərdarlıq ikonu göstərilməlidirmi (fərq 0 deyilsə). */
  showWarningIcon: boolean;
}

export function cashDiffPresentation(diff: number): CashDiffPresentation {
  if (diff < 0) {
    return {
      tone: "danger",
      title: "Kassada çatışmazlıq",
      showWarningIcon: true,
    };
  }
  if (diff > 0) {
    return {
      tone: "warning",
      title: "Yoxlanmalı uyğunsuzluq (artıq məbləğ)",
      showWarningIcon: true,
    };
  }
  return { tone: "success", title: "Kassa düz gəlib", showWarningIcon: false };
}
