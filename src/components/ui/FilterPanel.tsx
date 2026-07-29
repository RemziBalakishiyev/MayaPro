import { useId, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface FilterPanelProps {
  /** Aktiv filter sayı — badge və ilk açılış vəziyyəti üçün. */
  activeCount: number;
  children: ReactNode;
  /** Verilibsə, aktiv filter olduqda "sıfırla" düyməsi göstərilir. */
  onClear?: () => void;
  clearLabel?: string;
  label?: string;
  /** Xarici yerləşdirmə class-ları (məs. "min-w-0 flex-1"). */
  className?: string;
}

/**
 * Yığcam filter paneli — başlıqda aktiv filter sayı (badge), klikləyəndə
 * açılıb-bağlanan məzmun. Satış jurnalı, mallar və borclar səhifələrində
 * eyni naxış istifadə olunur.
 *
 * Məzmun DOM-da qalır (yalnız `hidden` olur) — belədə açıb-bağlayanda
 * daxildəki input/select-lər sıfırlanmır və `aria-controls` həmişə etibarlıdır.
 */
export function FilterPanel({
  activeCount,
  children,
  onClear,
  clearLabel = "Filterləri sıfırla",
  label = "Filterlər",
  className,
}: FilterPanelProps) {
  const panelId = useId();
  const [open, setOpen] = useState(() => activeCount > 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-stone-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700">
          <SlidersHorizontal size={16} className="text-stone-500" />
          {label}
          {activeCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              {activeCount}
            </span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-stone-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="space-y-3 border-t border-stone-200 px-3 py-3"
      >
        {children}

        {activeCount > 0 && onClear && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClear}
              className="text-sm font-semibold text-stone-500 hover:text-emerald-700"
            >
              {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
