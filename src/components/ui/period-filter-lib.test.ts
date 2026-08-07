import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatRangeChip,
  isoInRange,
  last12Months,
  matchQuickPeriod,
  monthRange,
  quickPeriodRange,
  validateRange,
} from "./period-filter-lib";

/** Sistem tarixini 2026-08-04 (çərşənbə) kimi fiksə edir — bütün testlər üçün ortaq. */
function freezeToday() {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 7, 4, 10, 0, 0));
}

describe("period-filter-lib", () => {
  beforeEach(freezeToday);
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("quickPeriodRange", () => {
    it("today — yalnız bugünkü gün", () => {
      expect(quickPeriodRange("today")).toEqual({
        from: "2026-08-04",
        to: "2026-08-04",
      });
    });

    it("week — son 7 gün (bu gün daxil)", () => {
      expect(quickPeriodRange("week")).toEqual({
        from: "2026-07-29",
        to: "2026-08-04",
      });
    });

    it("month — cari ayın 1-dən bu günə", () => {
      expect(quickPeriodRange("month")).toEqual({
        from: "2026-08-01",
        to: "2026-08-04",
      });
    });

    it("lastMonth (TC18) — keçən ayın tam aralığı", () => {
      expect(quickPeriodRange("lastMonth")).toEqual({
        from: "2026-07-01",
        to: "2026-07-31",
      });
    });

    it("lastMonth — il sərhədini düzgün keçir (yanvarda keçən il dekabrı)", () => {
      vi.setSystemTime(new Date(2026, 0, 15)); // 2026-01-15
      expect(quickPeriodRange("lastMonth")).toEqual({
        from: "2025-12-01",
        to: "2025-12-31",
      });
    });

    it("year — ilin 1 yanvarından bu günə", () => {
      expect(quickPeriodRange("year")).toEqual({
        from: "2026-01-01",
        to: "2026-08-04",
      });
    });

    it("all — sərhədsiz (boş obyekt)", () => {
      expect(quickPeriodRange("all")).toEqual({});
    });
  });

  describe("matchQuickPeriod", () => {
    it("boş aralığı 'all' kimi tanıyır", () => {
      expect(matchQuickPeriod({})).toBe("all");
      expect(matchQuickPeriod({ from: undefined, to: undefined })).toBe("all");
    });

    it("hazır çiplərdən birinə uyğun aralığı tanıyır", () => {
      expect(matchQuickPeriod(quickPeriodRange("month"))).toBe("month");
      expect(matchQuickPeriod(quickPeriodRange("lastMonth"))).toBe("lastMonth");
    });

    it("xüsusi (heç bir çipə uyğun olmayan) aralıq üçün null qaytarır", () => {
      expect(matchQuickPeriod({ from: "2026-03-05", to: "2026-03-20" })).toBeNull();
    });

    describe("FE#174 — toqquşan aralıqlarda təqvimə bağlı dövr sürüşən dövrdən üstündür", () => {
      it("ayın 7-də 'Bu həftə' və 'Bu ay' eyni aralığı verir — 'month' seçilməlidir", () => {
        vi.setSystemTime(new Date(2026, 7, 7, 10, 0, 0)); // 2026-08-07 (aslında toqquşma günü)
        // Ön şərt: iki açarın öz-özlüyündə eyni aralığı hesabladığını təsdiqləyir —
        // əks halda bu test heç nə sınamır (yalnız gündən asılı olmayaraq işləsin deyə).
        expect(quickPeriodRange("week")).toEqual(quickPeriodRange("month"));
        expect(matchQuickPeriod(quickPeriodRange("month"))).toBe("month");
        expect(matchQuickPeriod(quickPeriodRange("week"))).toBe("month");
      });

      it("yanvarın istənilən günündə 'Bu ay' və 'Bu il' toqquşa bilər — 'month' seçilir (mövcud davranış, FE#174-dən əvvəl də belə idi)", () => {
        vi.setSystemTime(new Date(2026, 0, 15, 10, 0, 0)); // 2026-01-15
        expect(quickPeriodRange("month")).toEqual(quickPeriodRange("year"));
        expect(matchQuickPeriod(quickPeriodRange("year"))).toBe("month");
      });

      it("'lastMonth' `to`-su həmişə keçən ayın son günüdür — heç vaxt bugünkü tarixə (digər açarların `to`-suna) bərabər olmadığı üçün toqquşma iştirakçısı deyil", () => {
        for (const day of [1, 7, 15, 28]) {
          vi.setSystemTime(new Date(2026, 7, day, 10, 0, 0));
          const lastMonth = quickPeriodRange("lastMonth");
          for (const key of ["today", "week", "month", "year"] as const) {
            expect(quickPeriodRange(key)).not.toEqual(lastMonth);
          }
        }
      });
    });
  });

  describe("last12Months (TC19)", () => {
    it("cari aydan başlayaraq 12 ayı azalan xronoloji sırada qaytarır", () => {
      const months = last12Months();
      expect(months).toHaveLength(12);
      expect(months[0]).toEqual({ ym: "2026-08", label: "Avqust 2026" });
      expect(months[1]).toEqual({ ym: "2026-07", label: "İyul 2026" });
      expect(months[11]).toEqual({ ym: "2025-09", label: "Sentyabr 2025" });
    });

    it("il sərhədini keçəndə düzgün il göstərir", () => {
      const months = last12Months();
      const dec = months.find((m) => m.ym === "2025-12");
      expect(dec?.label).toBe("Dekabr 2025");
    });
  });

  describe("monthRange", () => {
    it("ayın 1-dən son gününə qədər aralıq qurur", () => {
      expect(monthRange("2026-06")).toEqual({ from: "2026-06-01", to: "2026-06-30" });
    });

    it("fevral (uzun il olmayan) üçün 28 gün", () => {
      expect(monthRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    });

    it("fevral (uzun il) üçün 29 gün", () => {
      expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    });
  });

  describe("formatRangeChip", () => {
    it("gün.ay formatında, il olmadan göstərir", () => {
      expect(formatRangeChip("2026-06-01", "2026-06-30")).toBe("01.06 - 30.06");
    });
  });

  describe("validateRange (TC7)", () => {
    it("hər iki tarix doludursa və başlanğıc son tarixdən sonra deyilsə keçərlidir", () => {
      expect(validateRange("2026-03-05", "2026-03-20")).toBeNull();
    });

    it("başlanğıc son tarixdən sonradırsa xəta qaytarır", () => {
      expect(validateRange("2026-03-20", "2026-03-05")).toBe(
        "Başlanğıc tarix son tarixdən sonra ola bilməz",
      );
    });

    it("bərabər tarixlər keçərlidir (tək günlük aralıq)", () => {
      expect(validateRange("2026-03-05", "2026-03-05")).toBeNull();
    });

    it("boş sahə üçün xəta qaytarır", () => {
      expect(validateRange("", "2026-03-05")).toBe("Hər iki tarixi daxil edin");
      expect(validateRange("2026-03-05", "")).toBe("Hər iki tarixi daxil edin");
    });
  });

  describe("isoInRange", () => {
    it("from/to hər ikisi boşdursa həmişə true", () => {
      expect(isoInRange("2026-01-01")).toBe(true);
    });

    it("aralıqdan kənar tarixi rədd edir", () => {
      expect(isoInRange("2026-05-01", "2026-06-01", "2026-06-30")).toBe(false);
      expect(isoInRange("2026-07-01", "2026-06-01", "2026-06-30")).toBe(false);
    });

    it("aralıq daxilindəki (sərhədlər daxil) tarixi qəbul edir", () => {
      expect(isoInRange("2026-06-01", "2026-06-01", "2026-06-30")).toBe(true);
      expect(isoInRange("2026-06-30", "2026-06-01", "2026-06-30")).toBe(true);
      expect(isoInRange("2026-06-15", "2026-06-01", "2026-06-30")).toBe(true);
    });

    it("datetime (saat daxil) sətirlərdə də gün hissəsinə görə müqayisə edir", () => {
      expect(isoInRange("2026-06-15T23:59:00Z", "2026-06-01", "2026-06-30")).toBe(true);
    });
  });
});
