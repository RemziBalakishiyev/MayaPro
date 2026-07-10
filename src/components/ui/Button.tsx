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
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 active:bg-emerald-900 shadow-sm",
  secondary:
    "bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 active:bg-stone-100",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  ghost: "text-stone-700 hover:bg-stone-100 active:bg-stone-200",
  warn: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[38px] px-3.5 text-sm rounded-lg gap-1.5",
  md: "min-h-[44px] px-5 text-base rounded-xl gap-2",
  lg: "min-h-[52px] px-6 text-base rounded-xl gap-2",
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
        "inline-flex items-center justify-center font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
