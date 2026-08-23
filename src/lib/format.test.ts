import { describe, expect, it } from "vitest";
import { fmtPhone } from "./format";

/**
 * FE#188 — göstərim helperi: kanonik "994501234567" → "+994 50 123 45 67".
 * Cədvəllər/drawer-lər/qaimə görünüşləri bunu istifadə edir (bax
 * `CopyablePhone`, `CustomerPicker`, `SaleDetailDrawer`, `EmployeesTable`).
 */
describe("fmtPhone", () => {
  it("kanonik dəyəri insan-oxunaqlı formata çevirir", () => {
    expect(fmtPhone("994501234567")).toBe("+994 50 123 45 67");
  });

  it("plus/boşluqlu/yerli formatları da düzgün göstərir (giriş formatından asılı deyil)", () => {
    expect(fmtPhone("+994501234567")).toBe("+994 50 123 45 67");
    expect(fmtPhone("0501234567")).toBe("+994 50 123 45 67");
  });

  it("boş/null/undefined üçün boş sətir qaytarır", () => {
    expect(fmtPhone("")).toBe("");
    expect(fmtPhone(null)).toBe("");
    expect(fmtPhone(undefined)).toBe("");
  });
});
