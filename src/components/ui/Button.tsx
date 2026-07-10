import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost"
  | "warn";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm",
  secondary: "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-stone-600 hover:bg-stone-100",
  warn: "bg-amber-500 text-white hover:bg-amber-600",
};

const SIZE: Record<ButtonSize, string> = {
  md: "px-3.5 py-2 text-sm",
  sm: "px-2.5 py-1.5 text-xs",
  lg: "px-5 py-2.5 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mətndən əvvəl göstərilən ikon (məs. <Plus size={16} />) */
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "primary", size = "md", icon, className, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
