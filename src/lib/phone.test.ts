import { describe, expect, it } from "vitest";
import {
  formatLocalPhone,
  formatPhoneDisplay,
  isPhoneIncomplete,
  phoneDigits,
  toLocalPhoneDigits,
  toStoredPhone,
} from "./phone";

/**
 * FE#188 — vahid telefon maskası: bütün formatlar ("+994...", "994...",
 * "0501234567", boşluqlu/tirəli) eyni kanonik ("994XXXXXXXXX") dəyərə düşməli,
 * ekranda isə həmişə "50 123 45 67" formatında görünməlidir.
 */
describe("phoneDigits", () => {
  it("yalnız rəqəmləri saxlayır", () => {
    expect(phoneDigits("+994 (50) 123-45-67")).toBe("994501234567");
  });

  it("boş/undefined üçün boş sətir qaytarır", () => {
    expect(phoneDigits("")).toBe("");
  });
});

describe("toLocalPhoneDigits — istənilən giriş formatını 9 yerli rəqəmə salır", () => {
  it("+994XXXXXXXXX → yerli 9 rəqəm", () => {
    expect(toLocalPhoneDigits("+994501234567")).toBe("501234567");
  });

  it("994XXXXXXXXX (plus-sız) → yerli 9 rəqəm", () => {
    expect(toLocalPhoneDigits("994501234567")).toBe("501234567");
  });

  it("0XXXXXXXXX (yerli, öndə sıfır) → sıfır udulur", () => {
    expect(toLocalPhoneDigits("0501234567")).toBe("501234567");
  });

  it("boşluqlu yerli format ('50 123 45 67') → dəyişmədən qalır", () => {
    expect(toLocalPhoneDigits("50 123 45 67")).toBe("501234567");
  });

  it("9 rəqəmdən çoxu 9-a kəsilir (maksimum uzunluq)", () => {
    expect(toLocalPhoneDigits("99450123456789")).toBe("501234567");
  });
});

describe("formatLocalPhone — canlı yazarkən boşluq maskası", () => {
  it("tədricən artan uzunluqla düzgün qruplaşdırır", () => {
    expect(formatLocalPhone("5")).toBe("5");
    expect(formatLocalPhone("50")).toBe("50");
    expect(formatLocalPhone("501")).toBe("50 1");
    expect(formatLocalPhone("50123")).toBe("50 123");
    expect(formatLocalPhone("501234")).toBe("50 123 4");
    expect(formatLocalPhone("5012345")).toBe("50 123 45");
    expect(formatLocalPhone("50123456")).toBe("50 123 45 6");
    expect(formatLocalPhone("501234567")).toBe("50 123 45 67");
  });
});

describe("toStoredPhone — kanonik saxlama formatı", () => {
  it("hər hansı formatı '994XXXXXXXXX'-ə çevirir", () => {
    expect(toStoredPhone("0501234567")).toBe("994501234567");
    expect(toStoredPhone("+994 50 123 45 67")).toBe("994501234567");
    expect(toStoredPhone("50 123 45 67")).toBe("994501234567");
  });

  it("boş/natamam nömrə üçün boş sətir qaytarmır — natamam rəqəmlərlə qismən kanonik dəyər yaradır", () => {
    // Qismən yazılmış nömrə (PhoneInput hələ redaktə zamanı bunu saxlaya bilər).
    expect(toStoredPhone("501")).toBe("994501");
  });

  it("tamamilə boş sahə üçün boş sətir", () => {
    expect(toStoredPhone("")).toBe("");
  });
});

describe("formatPhoneDisplay — göstərim formatı", () => {
  it("kanonik dəyəri '+994 50 123 45 67' kimi göstərir", () => {
    expect(formatPhoneDisplay("994501234567")).toBe("+994 50 123 45 67");
  });

  it("boş dəyər üçün boş sətir", () => {
    expect(formatPhoneDisplay("")).toBe("");
  });
});

describe("isPhoneIncomplete — FE#188 natamam nömrə validasiyası", () => {
  it("boş sahə natamam SAYILMIR (məcburi qaydası ayrıca yoxlanılır)", () => {
    expect(isPhoneIncomplete("")).toBe(false);
  });

  it("9 yerli rəqəmdən az → natamam", () => {
    expect(isPhoneIncomplete("50 12")).toBe(true);
    expect(isPhoneIncomplete("994501")).toBe(true);
  });

  it("tam 9 yerli rəqəm → natamam DEYİL", () => {
    expect(isPhoneIncomplete("501234567")).toBe(false);
    expect(isPhoneIncomplete("994501234567")).toBe(false);
    expect(isPhoneIncomplete("+994 50 123 45 67")).toBe(false);
  });
});
