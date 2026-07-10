import { create } from "zustand";
import { persist } from "zustand/middleware";

/** WhatsApp borc xatırlatması üçün defolt şablon ({debt} əvəzlənir). */
export const DEFAULT_WA_TEMPLATE =
  "Salam, sizdə {debt} AZN qalıq borc görünür. Zəhmət olmasa ödənişi tamamlayın.";

export interface Settings {
  storeName: string;
  ownerName: string;
  whatsappTemplate: string;
  currency: string;
  defaultMinStock: number;
  language: string;
}

interface SettingsState extends Settings {
  update: (patch: Partial<Settings>) => void;
}

const DEFAULTS: Settings = {
  storeName: "Sədərək Anbar",
  ownerName: "",
  whatsappTemplate: DEFAULT_WA_TEMPLATE,
  currency: "AZN",
  defaultMinStock: 10,
  language: "az",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      update: (patch) => set(patch),
    }),
    { name: "sederek-settings" },
  ),
);
