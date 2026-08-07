import { describe, expect, it } from "vitest";
import {
  areSettingsEqual,
  buildWhatsappPreview,
  validateSettings,
} from "./lib";
import type { Settings } from "./store";

const base: Settings = {
  storeName: "Sədərək Anbar",
  ownerName: "Rəşad",
  address: "Sədərək TM",
  phone: "+994501234567",
  whatsappTemplate: "Salam, sizdə {debt} AZN qalıq borc görünür.",
  currency: "AZN",
  defaultMinStock: 10,
  language: "az",
};

describe("validateSettings — backend UpdateSettingsValidator ilə güzgülənir (FE#80)", () => {
  it("etibarlı formada heç bir xəta yoxdur", () => {
    expect(validateSettings(base)).toEqual({});
  });

  it("boş mağaza adı → xəta", () => {
    const errors = validateSettings({ ...base, storeName: "  " });
    expect(errors.storeName).toBe("Mağaza adı boş ola bilməz");
  });

  it("200 simvoldan uzun mağaza adı → xəta", () => {
    const errors = validateSettings({ ...base, storeName: "a".repeat(201) });
    expect(errors.storeName).toBe("Mağaza adı 200 simvoldan çox ola bilməz");
  });

  it("boş WhatsApp şablonu → xəta", () => {
    const errors = validateSettings({ ...base, whatsappTemplate: "" });
    expect(errors.whatsappTemplate).toBe("WhatsApp şablonu boş ola bilməz");
  });

  it("1000 simvoldan uzun şablon → xəta", () => {
    const errors = validateSettings({
      ...base,
      whatsappTemplate: "a".repeat(1001),
    });
    expect(errors.whatsappTemplate).toBe(
      "WhatsApp şablonu 1000 simvoldan çox ola bilməz",
    );
  });

  it("300 simvoldan uzun ünvan → xəta", () => {
    const errors = validateSettings({ ...base, address: "a".repeat(301) });
    expect(errors.address).toBe("Ünvan 300 simvoldan çox ola bilməz");
  });

  it("30 simvoldan uzun telefon → xəta", () => {
    const errors = validateSettings({ ...base, phone: "1".repeat(31) });
    expect(errors.phone).toBe("Telefon 30 simvoldan çox ola bilməz");
  });

  it("mənfi minimum stok → xəta", () => {
    const errors = validateSettings({ ...base, defaultMinStock: -1 });
    expect(errors.defaultMinStock).toBe("Minimum stok mənfi ola bilməz");
  });

  it("boş sahibkar adı/ünvan/telefon məcburi DEYİL — xəta yoxdur", () => {
    const errors = validateSettings({
      ...base,
      ownerName: "",
      address: "",
      phone: "",
    });
    expect(errors).toEqual({});
  });
});

describe("buildWhatsappPreview — {debt} şablon dəyişəni (FE#80 bənd 11-12)", () => {
  it("{debt}-i nümunə borc məbləği ilə əvəz edir", () => {
    expect(
      buildWhatsappPreview("Salam, sizdə {debt} AZN qalıq borc görünür."),
    ).toBe("Salam, sizdə 250.00 AZN qalıq borc görünür.");
  });

  it("bir neçə {debt} yer tutucusunu hamısını əvəz edir", () => {
    expect(buildWhatsappPreview("{debt} - {debt}")).toBe("250.00 - 250.00");
  });

  it("boş şablon → boş önizləmə", () => {
    expect(buildWhatsappPreview("   ")).toBe("");
  });

  it("{debt} olmayan şablonu olduğu kimi saxlayır", () => {
    expect(buildWhatsappPreview("Salam!")).toBe("Salam!");
  });
});

describe("areSettingsEqual — dirty-state müqayisəsi (FE#80 bənd 6)", () => {
  it("eyni dəyərlər → bərabər", () => {
    expect(areSettingsEqual(base, { ...base })).toBe(true);
  });

  it("fərqli sahə → bərabər deyil", () => {
    expect(areSettingsEqual(base, { ...base, ownerName: "Başqa" })).toBe(
      false,
    );
  });

  it("defaultMinStock string/number fərqini normallaşdırır", () => {
    expect(
      areSettingsEqual(base, {
        ...base,
        defaultMinStock: Number("10") as unknown as number,
      }),
    ).toBe(true);
  });
});
