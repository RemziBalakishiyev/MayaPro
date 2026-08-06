import { describe, expect, it } from "vitest";
import { daysAgoISO } from "@/lib/format";
import {
  DEBT_TONE_LABEL,
  debtAgeDays,
  debtTone,
} from "./debt-presentation";

/**
 * FE#73 (bənd 9) — borc rəngi/badge qaydasının unit testləri.
 * Qayda: borc yoxdur → "none"; <60 gün → "normal" (neytral, QIRMIZI DEYİL);
 * 60–119 gün → "overdue" (kəhrəba/narıncı); 120+ gün → "critical" (qırmızı,
 * YALNIZ bu ən ağır tərzdə).
 */
describe("debtTone", () => {
  it("borc <= 0 olduqda 'none' qaytarır (ödənilib)", () => {
    expect(debtTone(0, null)).toBe("none");
    expect(debtTone(-5, 400)).toBe("none");
  });

  it("borc var, yaş naməlum (null) olduqda 'normal' qaytarır — YANLIŞLIQLA kritik olmasın", () => {
    expect(debtTone(150, null)).toBe("normal");
  });

  it("borc var, 60 gündən AZ hərəkətsizlikdə 'normal' qaytarır", () => {
    expect(debtTone(150, 0)).toBe("normal");
    expect(debtTone(150, 59)).toBe("normal");
  });

  it("60–119 gün hərəkətsizlikdə 'overdue' qaytarır", () => {
    expect(debtTone(150, 60)).toBe("overdue");
    expect(debtTone(150, 119)).toBe("overdue");
  });

  it("120+ gün hərəkətsizlikdə 'critical' qaytarır", () => {
    expect(debtTone(150, 120)).toBe("critical");
    expect(debtTone(150, 400)).toBe("critical");
  });
});

describe("DEBT_TONE_LABEL", () => {
  it("hər ton üçün fərqli mətn (rəng tək göstərici deyil — DS 9-cu qayda)", () => {
    expect(DEBT_TONE_LABEL.none).toBe("Ödənilib");
    expect(DEBT_TONE_LABEL.normal).toBe("Borclu");
    expect(DEBT_TONE_LABEL.overdue).toBe("Gecikmiş borc");
    expect(DEBT_TONE_LABEL.critical).toBe("Kritik borc");
  });
});

describe("debtAgeDays", () => {
  it("son ödəniş tarixi mövcuddursa onu istifadə edir", () => {
    const age = debtAgeDays({
      lastPaymentDate: daysAgoISO(10),
      lastPurchaseDate: daysAgoISO(90),
      createdAt: daysAgoISO(200),
    });
    expect(age).toBe(10);
  });

  it("son ödəniş yoxdursa son alışa keçir", () => {
    const age = debtAgeDays({
      lastPaymentDate: "",
      lastPurchaseDate: daysAgoISO(45),
      createdAt: daysAgoISO(200),
    });
    expect(age).toBe(45);
  });

  it("nə ödəniş, nə alış yoxdursa yaradılma tarixinə keçir", () => {
    const age = debtAgeDays({
      lastPaymentDate: "",
      lastPurchaseDate: "",
      createdAt: daysAgoISO(5),
    });
    expect(age).toBe(5);
  });

  it("heç bir tarix yoxdursa null qaytarır (naməlum, kritik YOX)", () => {
    const age = debtAgeDays({
      lastPaymentDate: "",
      lastPurchaseDate: "",
      createdAt: undefined,
    });
    expect(age).toBeNull();
  });
});
