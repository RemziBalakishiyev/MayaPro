import { describe, expect, it } from "vitest";
import {
  DEBT_AGE_CRITICAL,
  DEBT_AGE_WARN,
  debtAgeTone,
  waLink,
} from "./lib";

/**
 * FE#74 (AC8/AC9/TC5-TC8) — "Borclar" görünüşündəki (`OpenDebtsTable`) borc
 * mənbəyi yaşının (`daysOld`) ciddilik pilləsi. Sabitlər (`DEBT_AGE_WARN=30`,
 * `DEBT_AGE_CRITICAL=60`) BİR yerdə tərif olunub (AC9), hardcode ədəd yoxdur.
 */
describe("DEBT_AGE_WARN / DEBT_AGE_CRITICAL", () => {
  it("konfiqurasiya oluna bilən sabitlərdir: 30 / 60", () => {
    expect(DEBT_AGE_WARN).toBe(30);
    expect(DEBT_AGE_CRITICAL).toBe(60);
  });
});

describe("debtAgeTone", () => {
  it("DEBT_AGE_WARN-dan az (təzə) 'neutral' qaytarır (TC5)", () => {
    expect(debtAgeTone(0)).toBe("neutral");
    expect(debtAgeTone(5)).toBe("neutral");
    expect(debtAgeTone(DEBT_AGE_WARN - 1)).toBe("neutral");
  });

  it("DEBT_AGE_WARN <= daysOld < DEBT_AGE_CRITICAL (köhnə) 'warn' qaytarır (TC6)", () => {
    expect(debtAgeTone(DEBT_AGE_WARN)).toBe("warn");
    expect(debtAgeTone(35)).toBe("warn");
    expect(debtAgeTone(DEBT_AGE_CRITICAL - 1)).toBe("warn");
  });

  it("daysOld >= DEBT_AGE_CRITICAL (çox köhnə) 'critical' qaytarır (TC7)", () => {
    expect(debtAgeTone(DEBT_AGE_CRITICAL)).toBe("critical");
    expect(debtAgeTone(65)).toBe("critical");
    expect(debtAgeTone(400)).toBe("critical");
  });
});

describe("waLink (TC17 — şablon axını qorunur)", () => {
  it("telefonu təmizləyir və {debt} şablonunu əvəzləyir", () => {
    const link = waLink("+994 (50) 123-45-67", 150.5, "Borcunuz: {debt} AZN");
    expect(link).toBe(
      `https://wa.me/994501234567?text=${encodeURIComponent("Borcunuz: 150.50 AZN")}`,
    );
  });
});
