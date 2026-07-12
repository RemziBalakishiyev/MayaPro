import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { ImagePlus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "./Button";
import { Input, inputCls } from "./Input";
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
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />

      {value ? (
        <div className="flex items-center gap-3">
          <img
            src={value}
            alt="Mal şəkli"
            className="h-24 w-24 shrink-0 rounded-xl border border-stone-200 object-cover"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={pick}
              disabled={disabled || uploading}
            >
              {uploading ? "Yüklənir..." : "Dəyiş"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => onChange("")}
              disabled={disabled || uploading}
            >
              Sil
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={disabled || uploading}
          className={`${inputCls} flex h-24 items-center justify-center gap-2 border-dashed bg-stone-50 text-stone-500 hover:border-emerald-400 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {uploading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-600" />
              Yüklənir...
            </>
          ) : (
            <>
              <ImagePlus size={18} /> Şəkil seç
            </>
          )}
        </button>
      )}
    </div>
  );
}
