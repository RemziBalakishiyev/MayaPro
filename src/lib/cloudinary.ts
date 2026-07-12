/**
 * Cloudinary unsigned şəkil yükləməsi.
 *
 * Konfiqurasiya iki env dəyişənindən gəlir (hər ikisi olmalıdır):
 *   VITE_CLOUDINARY_CLOUD_NAME, VITE_CLOUDINARY_UPLOAD_PRESET.
 * Boş olduqda CLOUDINARY_ENABLED=false → mal forması köhnə "Şəkil URL"
 * inputuna düşür (mock/demo rejimi pozulmasın).
 *
 * Qeyd: apiClient İSTİFADƏ OLUNMUR — o JSON Content-Type məcbur edir, halbuki
 * Cloudinary multipart/form-data (FormData) gözləyir.
 */

const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";

/** Hər iki env dəyəri varsa Cloudinary yükləməsi aktivdir. */
export const CLOUDINARY_ENABLED = !!(CLOUD && PRESET);

/** Şəkil üçün maksimum client-tərəf ölçü limiti (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Faylı Cloudinary-ə yükləyir və `secure_url` qaytarır.
 * 5MB-dan böyük fayl və ya server xətası halında Azərbaycanca mesajla `Error` atır.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!CLOUDINARY_ENABLED) {
    throw new Error("Şəkil yükləmə konfiqurasiyası yoxdur");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Şəkil 5 MB-dan böyük olmamalıdır");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", PRESET);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
      { method: "POST", body: form },
    );
  } catch {
    throw new Error("Şəkil yüklənmədi — şəbəkə xətası");
  }

  if (!res.ok) {
    throw new Error("Şəkil yüklənmədi — server xətası");
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Şəkil yüklənmədi — cavab boşdur");
  }
  return data.secure_url;
}
