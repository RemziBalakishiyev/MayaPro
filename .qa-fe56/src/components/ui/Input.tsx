import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Bütün input primitivlərinin paylaşdığı stil. */
export const inputCls =
  "w-full h-12 rounded-xl border border-stone-300 bg-white px-4 text-base text-stone-900 placeholder:text-stone-400 outline-none transition-shadow focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props} className={cn(inputCls, className)} />
  ),
);
Input.displayName = "Input";
