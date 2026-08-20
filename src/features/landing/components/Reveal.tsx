import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ENTER_HIDDEN,
  ENTER_SHOWN,
  ENTER_TRANSITION,
  prefersReducedMotion,
} from "./motion";

interface RevealProps {
  children: ReactNode;
  /** Ardıcıl elementlər üçün pilləli gecikmə (ms). 0–240 arası saxlanılır. */
  delay?: number;
  className?: string;
}

/**
 * Scroll-da bir dəfəlik yumşaq görünmə.
 *
 * Təhlükəsizlik qaydası: hərəkət mümkün deyilsə (reduced-motion və ya
 * IntersectionObserver yoxdur) məzmun DƏRHAL görünür — heç bir halda
 * "görünməz qalmış məzmun" riski yoxdur.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(
    () =>
      prefersReducedMotion() || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      style={
        shown && delay ? { transitionDelay: `${Math.min(delay, 240)}ms` } : undefined
      }
      className={cn(ENTER_TRANSITION, shown ? ENTER_SHOWN : ENTER_HIDDEN, className)}
    >
      {children}
    </div>
  );
}
