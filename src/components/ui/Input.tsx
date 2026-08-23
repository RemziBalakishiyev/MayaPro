import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Bütün input primitivlərinin paylaşdığı stil.
 * FE#69: hündürlük 48px (≥44px hədəf), radius vahid `control` tokenindən,
 * fokus halqası `focus-visible` ilə — mətn sahələri klikləndikdə də
 * `:focus-visible` şərtini ödədiyi üçün davranış dəyişmir.
 */
export const inputCls =
  "w-full h-12 rounded-control border border-stone-300 bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 outline-none transition-shadow hover:border-stone-400 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500";

export type InputSize = "md" | "lg";

/**
 * FE#187 — `lg` (52px) böyük toxunma hədəfi tələb olunan formalar üçün
 * (məs. login/qeydiyyat kartı). Defolt `md` `inputCls`-in öz `h-12`-sini
 * saxlayır (mövcud səhifələr dəyişmir). `!h-[52px]` (important) istifadə
 * olunur ki, utility class sırasından asılı olmadan etibarlı override etsin.
 */
const SIZE_CLS: Record<InputSize, string> = {
  md: "",
  lg: "!h-[52px]",
};

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Vizual ölçü tokeni — HTML-in native `size` (simvol sayı) atributu ilə QARIŞDIRILMASIN. */
  size?: InputSize;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = "md", ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={cn(inputCls, SIZE_CLS[size], className)}
    />
  ),
);
Input.displayName = "Input";
