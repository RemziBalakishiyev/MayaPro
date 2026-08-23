import { PLATFORM_ADMIN_PHONE } from "@/lib/config";

/**
 * FE#190 — qeydiyyat/pending ekranlarındakı "WhatsApp-la bildir" düyməsinin
 * linkini qurur. Mesajda istifadəçinin öz telefonu RAW (rəqəm) formatda
 * gedir (məs. "994501234567") — "+994 50 123 45 67" kimi ekran formatlaması
 * BİLƏRƏKDƏN istifadə OLUNMUR (admin nömrəsi isə wa.me yolunda, ayrı məsələdir).
 * Mağaza adı yoxdursa (pending/login ekranı) mesaj sadələşir.
 */
export function buildRegistrationWhatsAppUrl(
  storeName: string,
  phone: string,
): string {
  const store = storeName.trim();
  const text = store
    ? `Salam! MayaPro sistemində qeydiyyatdan keçdim. Mağaza: ${store}, Telefon: ${phone}. Zəhmət olmasa qeydiyyatımı təsdiqləyin.`
    : `Salam! MayaPro sistemində qeydiyyatdan keçdim. Telefon: ${phone}. Zəhmət olmasa qeydiyyatımı təsdiqləyin.`;
  return `https://wa.me/${PLATFORM_ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
}
