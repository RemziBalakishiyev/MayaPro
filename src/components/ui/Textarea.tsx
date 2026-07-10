import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const textareaCls =
  "w-full min-h-[96px] rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 outline-none transition-shadow focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 3, ...props }, ref) => (
    <textarea ref={ref} rows={rows} {...props} className={cn(textareaCls, className)} />
  ),
);
Textarea.displayName = "Textarea";
