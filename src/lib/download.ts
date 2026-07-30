/**
 * Auth-lı fayl endirmə — <a href> işləmir (Bearer lazımdır).
 * apiClient.getBlob → blob → müvəqqəti object URL → click → təmizlə.
 */
import { apiClient, type BlobResponse } from "@/lib/api-client";

/** Content-Disposition-dan filename çıxarır (filename= / filename*=). */
export const filenameFromContentDisposition = (
  header: string | null,
  fallback: string,
): string => {
  if (!header) return fallback;

  const utf8 = /filename\*\s*=\s*(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim().replace(/^["']|["']$/g, ""));
    } catch {
      /* ignore */
    }
  }

  const plain = /filename\s*=\s*("?)([^";]+)\1/i.exec(header);
  if (plain?.[2]) return plain[2].trim();

  return fallback;
};

/**
 * Blob-u faylı endirən müvəqqəti <a> ilə browser-ə "sırıyır".
 * Object URL dərhal deyil, növbəti tick-də azad edilir — Safari/Firefox-da
 * sinxron revoke bəzən endirməni yarımçıq kəsir.
 */
function triggerBlobDownload(blob: Blob, name: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Blob cavabını fayl kimi endirir (ad Content-Disposition-dan, yoxdursa fallback). */
async function saveBlobResponse(
  responsePromise: Promise<BlobResponse>,
  fallbackName: string,
): Promise<void> {
  const { blob, contentDisposition } = await responsePromise;
  triggerBlobDownload(
    blob,
    filenameFromContentDisposition(contentDisposition, fallbackName),
  );
}

/** GET path → blob endirmə. path tam API yolu olmalıdır, məs. /api/exports/products.xlsx */
export async function downloadFile(
  url: string,
  fallbackName: string,
): Promise<void> {
  await saveBlobResponse(apiClient.getBlob(url), fallbackName);
}

/**
 * POST path + JSON body → blob endirmə (məs. etiket PDF-i:
 * POST /api/exports/products/labels.pdf).
 */
export async function downloadFilePost(
  url: string,
  body: unknown,
  fallbackName: string,
): Promise<void> {
  await saveBlobResponse(apiClient.postBlob(url, body), fallbackName);
}
