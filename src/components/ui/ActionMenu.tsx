import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export type ActionMenuItem = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  tone?: "default" | "danger" | "success";
  /**
   * Deaktiv bənd: gizlədilmir, boz göstərilir və klik işləmir — istifadəçi
   * bəndin mövcud olduğunu, amma niyə işləmədiyini (`title`) görsün.
   * Bəndin ÜMUMİYYƏTLƏ görünməməsi lazımdırsa, çağıran tərəf onu `items`
   * massivinə əlavə etməməlidir (mövcud cədvəllərdəki şərti spread naxışı).
   */
  disabled?: boolean;
  /** Hover/fokusda görünən izah (məs. deaktivliyin səbəbi). */
  title?: string;
};

interface Props {
  items: ActionMenuItem[];
  /** Trigger üçün əlçatanlıq etiketi */
  "aria-label"?: string;
  /**
   * FE#69 — verilərsə trigger yalnız-ikon deyil, MƏTNLİ düymə kimi göstərilir
   * (səhifə başlığındakı «Digər əməliyyatlar» menyusu üçün). Verilməzsə
   * mövcud kompakt «⋯» görünüşü qalır (cədvəl sətirləri).
   */
  triggerLabel?: string;
}

const TONE: Record<NonNullable<ActionMenuItem["tone"]>, string> = {
  default: "text-stone-700 hover:bg-stone-50",
  danger: "text-red-600 hover:bg-red-50",
  success: "text-green-700 hover:bg-green-50",
};

/**
 * Cədvəl sətirində ikincil əməliyyatlar üçün kompakt «⋯» menyusu.
 */
export function ActionMenu({
  items,
  "aria-label": ariaLabel = "Digər əməliyyatlar",
  triggerLabel,
}: Props) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    placement: "bottom" | "top";
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const menuH = Math.min(items.length * 40 + 8, 280);
      const spaceBelow = window.innerHeight - rect.bottom;
      const placement =
        spaceBelow < menuH && rect.top > spaceBelow ? "top" : "bottom";
      const top =
        placement === "bottom" ? rect.bottom + 4 : rect.top - 4;
      const width = 200;
      const left = Math.max(
        8,
        Math.min(rect.right - width, window.innerWidth - width - 8),
      );
      setCoords({ top, left, placement });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  if (items.length === 0) return null;

  const menu =
    open && coords
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            style={{
              position: "fixed",
              top: coords.placement === "bottom" ? coords.top : undefined,
              bottom:
                coords.placement === "top"
                  ? window.innerHeight - coords.top
                  : undefined,
              left: coords.left,
              width: 200,
              zIndex: 60,
            }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
          >
            {items.map((item) => {
              const isDisabled = !!item.disabled;
              const className = cn(
                "flex min-h-[40px] w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors focus-ring-inset",
                isDisabled
                  ? "cursor-not-allowed text-stone-400"
                  : TONE[item.tone ?? "default"],
              );
              if (item.href && !isDisabled) {
                return (
                  <a
                    key={item.label}
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    title={item.title}
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                );
              }
              // `disabled` ATRİBUTU qəsdən verilmir: native disabled düymə
              // siçan hadisələrini udur → `title` tooltip-i heç vaxt görünmür,
              // fokus da almır. `aria-disabled` + klik qoruyucusu ilə bənd
              // həm oxunur, həm də səbəbi hover/fokusda göstərir.
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  title={item.title}
                  aria-disabled={isDisabled}
                  className={className}
                  onClick={() => {
                    if (isDisabled) return;
                    setOpen(false);
                    item.onClick?.();
                  }}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        title={triggerLabel ? undefined : ariaLabel}
        className={cn(
          // FE#69 — toxunma hədəfi 40px-ə qaldırıldı (F-38) və vahid fokus
          // halqası tətbiq olundu (R-15). Mətnli variant `triggerLabel` ilə.
          "inline-flex items-center justify-center border border-stone-300 bg-white font-semibold text-stone-600 transition-colors",
          "focus-ring hover:bg-stone-50 hover:text-stone-900 active:scale-[0.98]",
          triggerLabel
            ? "min-h-[40px] gap-2 rounded-chip px-3.5 text-sm"
            : "h-10 w-10 rounded-chip",
          open && "bg-stone-100 text-stone-900",
        )}
      >
        <MoreHorizontal size={18} />
        {triggerLabel}
      </button>
      {menu}
    </>
  );
}
