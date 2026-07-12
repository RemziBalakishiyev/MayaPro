import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Alt-da sabit (scroll olmayan) zolaq — məs. canlı nəticə + düymələr. */
  footer?: ReactNode;
  /** Desktop-da daha geniş panel (məs. mal forması). */
  wide?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelWidth = wide ? "sm:max-w-3xl" : "sm:max-w-xl";

  const header = (
    <div className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
      <h3 className="text-lg font-bold text-stone-900">{title}</h3>
      <button
        onClick={onClose}
        aria-label="Bağla"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
      >
        <X size={20} />
      </button>
    </div>
  );

  // Footer varsa: flex sütun — başlıq və footer sabit, orta hissə scroll olur.
  if (footer) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-stone-900/60" onClick={onClose} />
        <div
          className={cn(
            "absolute right-0 top-0 flex h-full w-full flex-col bg-white shadow-2xl",
            panelWidth,
          )}
        >
          {header}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
          <div className="shrink-0">{footer}</div>
        </div>
      </div>
    );
  }

  // Footer yoxdursa: köhnə davranış (bütün panel scroll, başlıq sticky).
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-stone-900/60" onClick={onClose} />
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-full overflow-y-auto bg-white shadow-2xl",
          panelWidth,
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
