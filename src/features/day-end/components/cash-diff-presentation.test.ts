import { describe, expect, it } from "vitest";
import { cashDiffPresentation } from "./cash-diff-presentation";

describe("cashDiffPresentation (AC-12 / R-02)", () => {
  it("MÜSBƏT fərq uğur deyil — kəhrəba «yoxlanmalı uyğunsuzluq»dur", () => {
    const p = cashDiffPresentation(60);
    expect(p.tone).toBe("warning");
    expect(p.tone).not.toBe("success");
    expect(p.title).toMatch(/uyğunsuzluq/i);
    expect(p.showWarningIcon).toBe(true);
  });

  it("MƏNFİ fərq qırmızı qalır (regresiya yoxdur)", () => {
    const p = cashDiffPresentation(-40);
    expect(p.tone).toBe("danger");
    expect(p.showWarningIcon).toBe(true);
  });

  it("SIFIR fərq uğur rəngindədir", () => {
    const p = cashDiffPresentation(0);
    expect(p.tone).toBe("success");
    expect(p.showWarningIcon).toBe(false);
  });
});
