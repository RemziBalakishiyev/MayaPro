import { createContext, useContext, useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";
import { lockBodyScroll } from "./dialog-layer";
import { useDrawerExpandStore } from "./drawer-store";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /**
   * Adi ReactNode və ya render-prop funksiyası — sonuncu halda cari
   * genişlənmə vəziyyəti (`isExpanded`) birbaşa ötürülür ki, valideyn
   * komponent (məs. ProductForm) öz düzülüşünü uyğunlaşdıra bilsin.
   */
  children: ReactNode | ((isExpanded: boolean) => ReactNode);
  /** Alt-da sabit (scroll olmayan) zolaq — məs. canlı nəticə + düymələr. */
  footer?: ReactNode;
  /** Desktop-da daha geniş panel (məs. mal forması) — daraldılmış vəziyyətdə tətbiq olunur. */
  wide?: boolean;
  /**
   * Genişlət/daralt düyməsini gizlətmək üçün — defolt AÇIQ (bütün drawer-lərdə
   * görünür). Yalnız genişlənmənin mənası olmayan çox kiçik panellərdə `false`
   * verilə bilər.
   */
  expandable?: boolean;
}

const DrawerExpandedContext = createContext(false);

/**
 * Drawer daxilindəki komponentlərin cari genişlənmə vəziyyətini oxuması üçün
 * — məs. formanın 2 sütunlu düzülüşə keçməsi. Drawer xaricində `false` qaytarır.
 */
export function useDrawerExpanded(): boolean {
  return useContext(DrawerExpandedContext);
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  expandable = true,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const expandedPreference = useDrawerExpandStore((s) => s.expanded);
  const toggleExpanded = useDrawerExpandStore((s) => s.toggle);
  const isExpanded = expandable && expandedPreference;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // FE#69 — `aria-modal="true"` vədi ilə uzlaşdırma: drawer açıqkən arxa
  // səhifə sürüşmür (Modal ilə ortaq sayğac).
  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

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

  const content = typeof children === "function" ? children(isExpanded) : children;

  // Genişlənmiş vəziyyət (`isExpanded`) hər şeydən üstündür — ekranın ~85%-i,
  // 6xl (72rem) ilə hüdudlanır. Daraldılmışda `wide` mövcud enləri qorumaq üçün.
  const panelWidth = isExpanded
    ? "sm:max-w-[min(85vw,72rem)]"
    : wide
      ? "sm:max-w-3xl"
      : "sm:max-w-xl";

  const expandButton = expandable ? (
    <button
      type="button"
      onClick={toggleExpanded}
      aria-pressed={isExpanded}
      title={isExpanded ? "Daralt" : "Genişlət"}
      className={cn(
        "focus-ring hidden min-h-[40px] shrink-0 items-center gap-1.5 rounded-control border px-3 text-sm font-semibold transition-colors sm:flex",
        isExpanded
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-700",
      )}
    >
      {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
      {isExpanded ? "Daralt" : "Genişlət"}
    </button>
  ) : null;

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
      <div className="flex shrink-0 items-center gap-2">
        {expandButton}
        <IconButton label="Bağla" icon={<X size={20} />} onClick={onClose} />
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
          "absolute right-0 top-0 h-full w-full bg-white shadow-panel outline-none transition-[max-width] duration-[250ms] ease-out",
          // Footer varsa: başlıq və footer sabit, yalnız orta hissə scroll olur.
          footer ? "flex flex-col" : "overflow-y-auto",
          panelWidth,
        )}
      >
        {header}
        <DrawerExpandedContext.Provider value={isExpanded}>
          {footer ? (
            <>
              <div className="flex-1 overflow-y-auto p-5">{content}</div>
              <div className="shrink-0">{footer}</div>
            </>
          ) : (
            <div className="p-5">{content}</div>
          )}
        </DrawerExpandedContext.Provider>
      </div>
    </div>
  );
}

/**
 * FE#69 — `DetailDrawer` dizayn sistemindəki standart addır: sətir/kart
 * detalını göstərən sağ panel. Eyni komponentdir (`Drawer`), yeni davranış
 * əlavə edilmir — ad vahidləşdirilir.
 */
export const DetailDrawer = Drawer;
export type DetailDrawerProps = DrawerProps;
