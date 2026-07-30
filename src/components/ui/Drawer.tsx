import { useEffect, useId, useRef } from "react";
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
  /** Tam ekran eni — `wide`-dan üstündür (məs. mal formunun böyüdülmüş rejimi). */
  maximized?: boolean;
  /** Başlıqla bağlama düyməsi arasında əlavə düymə (məs. böyüt/kiçilt). */
  headerExtra?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  maximized,
  headerExtra,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Açılanda fokus panelə keçir (daxildə autoFocus-lu sahə varsa ona toxunmur),
  // bağlananda isə paneli açan düyməyə qaytarılır — klaviatura ilə işləyən
  // istifadəçi siyahıda yerini itirmir.
  useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (panel && !panel.contains(document.activeElement)) panel.focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  if (!open) return null;

  // `maximized` → `wide`-dan üstündür (tam ekran eni).
  const panelWidth = maximized
    ? "sm:max-w-full"
    : wide
      ? "sm:max-w-3xl"
      : "sm:max-w-xl";

  // Footer varsa başlıq flex sütunun sabit sətri, yoxsa scroll edən panelin
  // sticky sətridir — qalan hər şey eynidir.
  const header = (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4",
        footer ? "shrink-0" : "sticky top-0 z-10",
      )}
    >
      <h3
        id={titleId}
        className="min-w-0 flex-1 truncate text-lg font-bold text-stone-900"
      >
        {title}
      </h3>
      <div className="flex shrink-0 items-center gap-1">
        {headerExtra}
        <button
          type="button"
          onClick={onClose}
          aria-label="Bağla"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        className="absolute inset-0 bg-stone-900/60"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "absolute right-0 top-0 h-full w-full bg-white shadow-2xl outline-none transition-[max-width] duration-200 ease-out",
          // Footer varsa: başlıq və footer sabit, yalnız orta hissə scroll olur.
          footer ? "flex flex-col" : "overflow-y-auto",
          panelWidth,
        )}
      >
        {header}
        {footer ? (
          <>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            <div className="shrink-0">{footer}</div>
          </>
        ) : (
          <div className="p-5">{children}</div>
        )}
      </div>
    </div>
  );
}
