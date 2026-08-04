/**
 * Satışın qaimə linkini WhatsApp-la müştəriyə göndərmə hook-u.
 *
 * Axın: POST /api/sales/{id}/invoice-link → {url} → wa.me linki yeni tabda açılır.
 * Mesaj şablonu: "Salam! {storeName} — {date} tarixli alışınızın qaiməsi: {url}"
 * Mock rejimdə real çağırış yoxdur, info toast göstərilir.
 */
import { useCallback, useState } from "react";
import { useToastStore } from "@/components/ui/toast-store";
import { apiClient, USE_MOCK } from "@/lib/api-client";
import { useSettingsStore } from "@/features/settings/store";
import { fmtDate } from "@/lib/format";

interface InvoiceLinkDto {
  url: string;
}

/** wa.me telefon hissəsi — yalnız rəqəmlər. */
const phoneDigits = (phone: string): string => (phone || "").replace(/\D/g, "");

/** Mesajı qur — bütün istifadəçilər eyni şablonu görsün. */
export const buildInvoiceMessage = (
  storeName: string,
  saleDateIso: string,
  url: string,
): string => {
  const date = fmtDate(saleDateIso, "dd.MM.yyyy");
  const store = storeName?.trim() || "Mağaza";
  return `Salam! ${store} — ${date} tarixli alışınızın qaiməsi: ${url}`;
};

export function useInvoiceWhatsApp() {
  const push = useToastStore((s) => s.push);
  const storeName = useSettingsStore((s) => s.storeName);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const send = useCallback(
    async (
      saleId: string,
      customerPhone: string,
      saleDateIso: string,
    ): Promise<void> => {
      const digits = phoneDigits(customerPhone);
      if (!digits) {
        push("error", "Müştəri telefonu yoxdur");
        return;
      }
      if (USE_MOCK) {
        push("info", "WhatsApp göndərmə real backend rejimində işləyir");
        return;
      }
      setPendingId(saleId);
      try {
        const { url } = await apiClient.post<InvoiceLinkDto>(
          `/api/sales/${saleId}/invoice-link`,
        );
        const text = buildInvoiceMessage(storeName, saleDateIso, url);
        const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
      } catch (e) {
        push(
          "error",
          e instanceof Error ? e.message : "WhatsApp linki alınmadı",
        );
      } finally {
        setPendingId(null);
      }
    },
    [push, storeName],
  );

  return { send, pendingId };
}
