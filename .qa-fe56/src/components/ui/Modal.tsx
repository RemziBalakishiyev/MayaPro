import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Geniş variant (max-w-3xl) */
  wide?: boolean;
}

/**
 * Açıq modalların yığını — üst-üstə açılanda (məs. ödəniş modalı üzərindən
 * "Yeni müştəri") ESC YALNIZ ən üstdəkini bağlasın və arxa fon sürüşməsi
 * yalnız sonuncu modal bağlananda bərpa olunsun.
 */
const openStack: symbol[] = [];

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Modal yığını + arxa fon sürüşməsinin bloklanması (mobil "body scroll").
  useEffect(() => {
    if (!open) return;
    const token = Symbol("modal");
    openStack.push(token);
    document.body.style.overflow = "hidden";
    return () => {
      const i = openStack.indexOf(token);
      if (i >= 0) openStack.splice(i, 1);
      // Sonuncu modal bağlananda inline stil tamamilə götürülür (hansı sıra ilə
      // bağlanmasından asılı olmayaraq body kilidli qalmasın).
      if (openStack.length === 0) document.body.style.overflow = "";
    };
  }, [open]);

  // Fokus idarəsi: açılanda fokus modalın içinə keçir (autoFocus olan sahə
  // varsa ona toxunulmur), bağlananda çağıran düyməyə geri qayıdır.
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    if (!panelRef.current?.contains(document.activeElement)) {
      panelRef.current?.focus();
    }
    return () => prevActive?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    /** Üst-üstə açılan modallarda yalnız ən sonuncu panel "aktiv" sayılır. */
    const isTopPanel = () => {
      const panels = document.querySelectorAll("[data-modal-panel]");
      return panels[panels.length - 1] === panelRef.current;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isTopPanel()) onClose();
        return;
      }
      // Sadə fokus tələsi — Tab modalın içində dövr edir.
      if (e.key !== "Tab" || !panelRef.current || !isTopPanel()) return;
      const nodes = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (nodes.length === 0) return;
      const firstEl = nodes[0];
      const lastEl = nodes[nodes.length - 1];
      if (!panelRef.current.contains(document.activeElement)) return;
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-stone-900/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        data-modal-panel=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          "relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-2xl",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white px-5 py-4">
          <h3 id={titleId} className="text-lg font-bold text-stone-900">
            {title}
          </h3>
          <button
            type="button"
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
