import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { inputCls } from "./Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 2, ...props }, ref) => (
    <textarea ref={ref} rows={rows} {...props} className={cn(inputCls, className)} />
  ),
);
Textarea.displayName = "Textarea";
