import {
  useEffect,
  useId,
  useMemo,
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
  disabled?: boolean;
};

interface Props {
  items: ActionMenuItem[];
  /** Trigger üçün əlçatanlıq etiketi */
  "aria-label"?: string;
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

  const visible = useMemo(
    () => items.filter((i) => !i.disabled),
    [items],
  );

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const menuH = Math.min(visible.length * 40 + 8, 280);
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
  }, [open, visible.length]);

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

  if (visible.length === 0) return null;

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
            {visible.map((item) => {
              const className = cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors",
                TONE[item.tone ?? "default"],
              );
              if (item.href) {
                return (
                  <a
                    key={item.label}
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                );
              }
              return (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={className}
                  onClick={() => {
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
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors",
          "hover:bg-stone-50 hover:text-stone-800",
          open && "bg-stone-100 text-stone-800 ring-2 ring-stone-200",
        )}
      >
        <MoreHorizontal size={16} />
      </button>
      {menu}
    </>
  );
}
