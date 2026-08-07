import { describe, expect, it } from "vitest";
import { employeeRoleLabel, salaryProgressPercent } from "./lib";

/**
 * FE#79 (AC-6) — rol kodu → sabit, oxunaqlı Azərbaycanca etiket. Backend
 * kiçik hərfli kod göndərir (`sahib`/`menecer`/`satici`), mock/test
 * fixture-ları isə artıq oxunaqlı mətnlə (`Sahibkar`/`Satıcı`) gəlir — hər
 * ikisi eyni etiketə düşməlidir ki, `Badge` tonu HƏMİŞƏ eyni olsun.
 */
describe("employeeRoleLabel", () => {
  it("backend kodlarını Azərbaycanca etiketə çevirir", () => {
    expect(employeeRoleLabel("sahib")).toBe("Sahibkar");
    expect(employeeRoleLabel("menecer")).toBe("Menecer");
    expect(employeeRoleLabel("kassir")).toBe("Kassir");
    expect(employeeRoleLabel("satici")).toBe("Satıcı");
  });

  it("artıq oxunaqlı mətni olduğu kimi qaytarır (mock fixture uyğunluğu)", () => {
    expect(employeeRoleLabel("Sahibkar")).toBe("Sahibkar");
    expect(employeeRoleLabel("Satıcı")).toBe("Satıcı");
  });

  it("naməlum dəyəri olduğu kimi qaytarır (Badge FALLBACK tonuna düşür)", () => {
    expect(employeeRoleLabel("naməlum-rol")).toBe("naməlum-rol");
  });
});

describe("salaryProgressPercent (TOXUNULMAZLIQ regressiyası — hesablama dəyişməyib)", () => {
  it("maaş 0-dırsa 0 qaytarır", () => {
    expect(salaryProgressPercent(100, 0)).toBe(0);
  });

  it("0-100 aralığına sıxılır", () => {
    expect(salaryProgressPercent(50, 1000)).toBe(5);
    expect(salaryProgressPercent(1500, 1000)).toBe(100);
  });
});
