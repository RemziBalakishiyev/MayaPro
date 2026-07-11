/**
 * Settings API qatı — mock/real sərhədi.
 * Mənbə API-dır; Zustand persist store yerli cache kimi qalır.
 */
import { apiClient, USE_MOCK } from "@/lib/api-client";
import { useSettingsStore, type Settings } from "./store";

interface SettingsDto {
  storeName: string;
  ownerName: string | null;
  whatsappTemplate: string;
  currency: string;
  defaultMinStock: number;
  language: string;
}

const toSettings = (d: SettingsDto): Settings => ({
  storeName: d.storeName,
  ownerName: d.ownerName ?? "",
  whatsappTemplate: d.whatsappTemplate,
  currency: d.currency,
  defaultMinStock: d.defaultMinStock,
  language: d.language,
});

/** Mock rejim üçün store-un cari dəyərləri (update funksiyası xaric). */
const snapshot = (): Settings => {
  const s = useSettingsStore.getState();
  return {
    storeName: s.storeName,
    ownerName: s.ownerName,
    whatsappTemplate: s.whatsappTemplate,
    currency: s.currency,
    defaultMinStock: s.defaultMinStock,
    language: s.language,
  };
};

export const settingsApi = {
  get: (): Promise<Settings> =>
    USE_MOCK
      ? Promise.resolve(snapshot())
      : apiClient.get<SettingsDto>("/api/settings").then(toSettings),

  update: (patch: Settings): Promise<Settings> =>
    USE_MOCK
      ? Promise.resolve(patch)
      : apiClient.put<SettingsDto>("/api/settings", patch).then(toSettings),
};
