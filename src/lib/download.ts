/**
 * Auth-lı fayl endirmə — <a href> işləmir (Bearer lazımdır).
 * apiClient.getBlob → blob → müvəqqəti object URL → click → təmizlə.
 */
import { apiClient } from "@/lib/api-client";

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

/** GET path → blob endirmə. path tam API yolu olmalıdır, məs. /api/exports/products.xlsx */
export async function downloadFile(
  url: string,
  fallbackName: string,
): Promise<void> {
  const { blob, contentDisposition } = await apiClient.getBlob(url);
  const name = filenameFromContentDisposition(
    contentDisposition,
    fallbackName,
  );

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}
