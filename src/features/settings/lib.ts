import type { Settings } from "./store";

export type SettingsFieldErrors = Partial<Record<keyof Settings, string>>;

/**
 * FE#80 — inline sahə xətaları backend `UpdateSettingsValidator`
 * (`MayaPro.WarehouseApi.Modules.Settings`) ilə EYNİ qaydaları güzgüləyir.
 * Heç bir YENİ qayda əlavə OLUNMUR — yalnız serverdə onsuz da mövcud olan
 * validasiya form göndərilməzdən əvvəl sahənin yanında göstərilir.
 */
export function validateSettings(f: Settings): SettingsFieldErrors {
  const errors: SettingsFieldErrors = {};

  const storeName = f.storeName.trim();
  if (!storeName) errors.storeName = "Mağaza adı boş ola bilməz";
  else if (f.storeName.length > 200)
    errors.storeName = "Mağaza adı 200 simvoldan çox ola bilməz";

  if (f.ownerName.length > 200)
    errors.ownerName = "Sahib adı 200 simvoldan çox ola bilməz";

  if (f.address.length > 300)
    errors.address = "Ünvan 300 simvoldan çox ola bilməz";

  if (f.phone.length > 30)
    errors.phone = "Telefon 30 simvoldan çox ola bilməz";

  const whatsappTemplate = f.whatsappTemplate.trim();
  if (!whatsappTemplate) errors.whatsappTemplate = "WhatsApp şablonu boş ola bilməz";
  else if (f.whatsappTemplate.length > 1000)
    errors.whatsappTemplate = "WhatsApp şablonu 1000 simvoldan çox ola bilməz";

  if (!Number.isFinite(f.defaultMinStock) || f.defaultMinStock < 0)
    errors.defaultMinStock = "Minimum stok mənfi ola bilməz";

  return errors;
}

/** Canlı önizləmədə istifadə olunan nümunə borc məbləği. */
export const SAMPLE_DEBT_PREVIEW = "250.00";

/**
 * WhatsApp şablonundaki `{debt}` yer tutucusunu nümunə borc məbləği ilə
 * əvəz edərək son mesajın necə görünəcəyini göstərir (F-15 bənd 12).
 * Saxlanan şablona TOXUNMUR — yalnız lokal draft-dan oxunan təqdimat.
 */
export function buildWhatsappPreview(template: string): string {
  if (!template.trim()) return "";
  return template.split("{debt}").join(SAMPLE_DEBT_PREVIEW);
}

/** İki ayarlar snapshotunun bərabərliyi — dirty-state (bənd 6) üçün. */
export function areSettingsEqual(a: Settings, b: Settings): boolean {
  return (
    a.storeName === b.storeName &&
    a.ownerName === b.ownerName &&
    a.address === b.address &&
    a.phone === b.phone &&
    a.whatsappTemplate === b.whatsappTemplate &&
    a.currency === b.currency &&
    Number(a.defaultMinStock) === Number(b.defaultMinStock) &&
    a.language === b.language
  );
}
