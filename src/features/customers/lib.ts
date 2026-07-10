import { DEFAULT_WA_TEMPLATE } from "@/features/settings/store";

/**
 * WhatsApp borc xatırlatma linki.
 * Telefon `\D` təmizlənir; şablondakı {debt} borc məbləği ilə əvəzlənir.
 */
export const waLink = (
  phone: string,
  debt: number,
  template: string = DEFAULT_WA_TEMPLATE,
): string => {
  const clean = (phone || "").replace(/\D/g, "");
  const text = (template || DEFAULT_WA_TEMPLATE).replace(
    "{debt}",
    debt.toFixed(2),
  );
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
};
