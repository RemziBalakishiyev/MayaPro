import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { inputCls } from "./Input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, className, ...props }, ref) => (
    <select ref={ref} {...props} className={cn(inputCls, className)}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";
