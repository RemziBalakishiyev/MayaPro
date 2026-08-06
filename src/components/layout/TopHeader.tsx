import type { ReactNode } from "react";
import { Menu } from "lucide-react";

export interface TopHeaderProps {
  /** Mobil ekranda göstərilən qısa başlıq (mağaza adı). */
  title: string;
  /** Mərkəzdəki qlobal axtarış sahəsi (`GlobalProductSearch`). */
  search?: ReactNode;
  /** Sağ tərəf — istifadəçi nişanı və s. */
  right?: ReactNode;
  onMenuClick: () => void;
}

/**
 * FE#69 — vahid üst zolaq (AC-16). Hündürlük `h-header` (4rem) tokenindən
 * gəlir və bütün route-larda eynidir; sticky davranış saxlanılıb.
 */
export function TopHeader({
  title,
  search,
  right,
  onMenuClick,
}: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white">
      <div className="flex h-header items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Menyu"
          title="Menyu"
          className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-stone-600 hover:bg-stone-100 lg:hidden"
        >
          <Menu size={24} />
        </button>

        <h2 className="shrink-0 text-lg font-bold text-stone-800 lg:hidden">
          {title}
        </h2>

        {search}

        {right && (
          <div className="ml-auto flex shrink-0 items-center gap-3">{right}</div>
        )}
      </div>
    </header>
  );
}
