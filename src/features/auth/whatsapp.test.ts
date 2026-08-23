import { describe, expect, it } from "vitest";
import { buildRegistrationWhatsAppUrl } from "./whatsapp";
import { PLATFORM_ADMIN_PHONE } from "@/lib/config";

/**
 * FE#190 — qeydiyyat/pending ekranlarındakı WhatsApp bildiriş linki:
 * admin nömrəsi sabit konfiqdən gəlir, mesaj mağaza adının olub-olmamasına
 * görə fərqlənir, istifadəçinin öz telefonu RAW formatda gedir.
 */
describe("buildRegistrationWhatsAppUrl", () => {
  it("mağaza adı ilə tam mesaj qurur və admin nömrəsinə wa.me linki verir", () => {
    const url = buildRegistrationWhatsAppUrl("Sədərək Market", "994501112233");

    expect(url).toBe(
      `https://wa.me/${PLATFORM_ADMIN_PHONE}?text=${encodeURIComponent(
        "Salam! MayaPro sistemində qeydiyyatdan keçdim. Mağaza: Sədərək Market, Telefon: 994501112233. Zəhmət olmasa qeydiyyatımı təsdiqləyin.",
      )}`,
    );
  });

  it("mağaza adı boşdursa sadələşdirilmiş mesaj qurur", () => {
    const url = buildRegistrationWhatsAppUrl("", "994501112233");

    expect(url).toBe(
      `https://wa.me/${PLATFORM_ADMIN_PHONE}?text=${encodeURIComponent(
        "Salam! MayaPro sistemində qeydiyyatdan keçdim. Telefon: 994501112233. Zəhmət olmasa qeydiyyatımı təsdiqləyin.",
      )}`,
    );
  });

  it("telefonu ekran formatına (+994 ... boşluqlu) SALMIR — mesajda raw qalır", () => {
    const url = buildRegistrationWhatsAppUrl("Test Market", "994501112233");

    expect(url).not.toContain(encodeURIComponent("+994 50"));
    expect(decodeURIComponent(url)).toContain("Telefon: 994501112233");
  });
});
