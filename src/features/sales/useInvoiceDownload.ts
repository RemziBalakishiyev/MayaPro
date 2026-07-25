/**
 * Satışın qaimə-faktura PDF-i (A5) — jurnal, detal drawer və satış təsdiqi üçün ortaq endirmə.
 * Mock rejimdə endirmə yoxdur, info toast göstərilir.
 */
import { useCallback, useState } from "react";
import { useToastStore } from "@/components/ui/toast-store";
import { USE_MOCK } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";

/** GET /api/exports/sales/{id}/invoice.pdf */
export const invoicePath = (saleId: string): string =>
  `/api/exports/sales/${saleId}/invoice.pdf`;

export function useInvoiceDownload() {
  // Selector ilə stabil referans — cədvəl sütunlarının memo-su pozulmasın.
  const push = useToastStore((s) => s.push);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const download = useCallback(
    async (saleId: string): Promise<void> => {
      if (USE_MOCK) {
        push("info", "Qaimə real backend rejimində işləyir");
        return;
      }
      setPendingId(saleId);
      try {
        await downloadFile(
          invoicePath(saleId),
          `qaime-${saleId.slice(0, 8)}.pdf`,
        );
      } catch (e) {
        push("error", e instanceof Error ? e.message : "Qaimə endirilmədi");
      } finally {
        setPendingId(null);
      }
    },
    [push],
  );

  return { download, pendingId };
}
