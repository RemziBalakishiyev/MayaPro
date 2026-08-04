import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "./api";
import { useSettingsStore, type Settings } from "./store";

export const settingsKeys = {
  all: ["settings"] as const,
};

export const useSettings = () =>
  useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.get,
  });

/**
 * Serverdən ayarları yükləyib Zustand cache-ini yeniləyir.
 * Layout səviyyəsində çağırılır ki, mağaza adı və s. mənbəsi API olsun.
 */
export const useHydrateSettings = (): void => {
  const { data } = useSettings();
  const update = useSettingsStore((s) => s.update);
  useEffect(() => {
    if (data) update(data);
  }, [data, update]);
};

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  const update = useSettingsStore((s) => s.update);
  return useMutation({
    mutationFn: (patch: Settings) => settingsApi.update(patch),
    onSuccess: (data) => {
      update(data);
      qc.setQueryData(settingsKeys.all, data);
    },
  });
};
