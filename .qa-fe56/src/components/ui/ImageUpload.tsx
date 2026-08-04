import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { Input } from "./Input";
import { useToast } from "./toast-store";
import { CLOUDINARY_ENABLED, uploadImage } from "@/lib/cloudinary";

interface Props {
  /** Cari şəkil URL-i (form state). */
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

/**
 * Mal şəkli üçün Cloudinary yükləmə komponenti.
 *
 * - Cloudinary konfiqurasiyası varsa: "Şəkil seç" (fayl → kvadrat preview),
 *   yüklənərkən spinner, xətada Az toast, 5MB limiti util-də yoxlanır.
 * - Konfiqurasiya boşdursa köhnə URL text inputuna düşür (mock/demo pozulmasın).
 */
export function ImageUpload({ value, onChange, disabled }: Props) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Fallback: Cloudinary yoxdursa sadə URL inputu.
  if (!CLOUDINARY_ENABLED) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... və ya boş"
        disabled={disabled}
      />
    );
  }

  const pick = () => fileRef.current?.click();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // eyni faylı təkrar seçməyə imkan ver
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Şəkil yüklənmədi");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {value ? (
        // Böyük kvadrat preview + üstündə Dəyiş/Sil zolağı.
        <div className="relative h-32 w-32 overflow-hidden rounded-2xl border border-stone-200">
          <img src={value} alt="Mal şəkli" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex divide-x divide-white/20 bg-stone-900/60 text-white">
            <button
              type="button"
              onClick={pick}
              disabled={disabled || uploading}
              className="flex flex-1 items-center justify-center gap-1 py-1.5 text-xs font-semibold hover:bg-stone-900/80 disabled:opacity-50"
            >
              <RefreshCw size={12} /> Dəyiş
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={disabled || uploading}
              className="flex flex-1 items-center justify-center gap-1 py-1.5 text-xs font-semibold hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 size={12} /> Sil
            </button>
          </div>
        </div>
      ) : (
        // Cəlbedici drop-zone.
        <button
          type="button"
          onClick={pick}
          disabled={disabled || uploading}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 py-7 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600" />
              <span className="text-sm font-semibold text-stone-600">
                Yüklənir...
              </span>
            </>
          ) : (
            <>
              <ImagePlus size={26} className="text-stone-400" />
              <span className="text-sm font-semibold text-stone-700">
                Şəkil əlavə et
              </span>
              <span className="text-xs text-stone-400">
                Kameradan və ya qalereyadan
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
