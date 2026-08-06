import { describe, expect, it } from "vitest";
import {
  DEBT_AGE_CRITICAL,
  DEBT_AGE_WARN,
  debtAgeTone,
  findUniqueCustomerByName,
  waLink,
} from "./lib";
import type { Customer } from "@/types";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    name: "Əli Vəliyev",
    phone: "994501234567",
    totalDebt: 500,
    paidAmount: 0,
    remainingDebt: 500,
    initialDebt: 0,
    totalPurchases: 500,
    purchaseCount: 1,
    lastPurchaseDate: "",
    lastPaymentDate: "",
    ...overrides,
  };
}

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

/**
 * FE#74 (AC5, TC10-TC12) — "Ən çox borclu" klik davranışının ad-uyğunluq
 * qaydası: `_app.borclar.tsx`-dəki `selectDebtor` bu funksiyaya əsaslanır.
 */
describe("findUniqueCustomerByName", () => {
  it("TC10 — tam BİR uyğun müştəri tapılırsa onu qaytarır", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Əli Vəliyev" }),
      makeCustomer({ id: "c2", name: "Vəli Əliyev" }),
    ];
    expect(findUniqueCustomerByName(customers, "Əli Vəliyev")).toEqual(
      customers[0],
    );
  });

  it("TC11 — heç bir uyğun müştəri tapılmazsa null qaytarır (fallback)", () => {
    const customers = [makeCustomer({ id: "c1", name: "Əli Vəliyev" })];
    expect(findUniqueCustomerByName(customers, "Silinmiş Müştəri")).toBeNull();
  });

  it("TC11 — ad birdən çox müştəriyə uyğun gəlirsə (birqiymətli deyil) null qaytarır (fallback)", () => {
    const customers = [
      makeCustomer({ id: "c1", name: "Əli Vəliyev" }),
      makeCustomer({ id: "c2", name: "Əli Vəliyev" }),
    ];
    expect(findUniqueCustomerByName(customers, "Əli Vəliyev")).toBeNull();
  });

  it("TC12 — boş siyahıda null qaytarır", () => {
    expect(findUniqueCustomerByName([], "Əli Vəliyev")).toBeNull();
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
