import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** `Input` ilə eyni fokus/kənar dili — FE#69 vahid forma qatı. */
const textareaCls =
  "w-full min-h-[96px] rounded-control border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition-shadow hover:border-stone-400 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} {...props} className={cn(textareaCls, className)} />
  ),
);
Textarea.displayName = "Textarea";
