import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { formatLocalPhone, toLocalPhoneDigits, toStoredPhone } from "@/lib/phone";
import { inputCls } from "./Input";

export type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  /** Saxlanılan format: "994501234567" və ya "". */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Azərbaycan mobil nömrəsi: sabit +994 prefiksi + 50 123 45 67 maskası.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, placeholder = "50 123 45 67", ...props }, ref) => {
    const display = formatLocalPhone(value);

    return (
      <div
        className={cn(
          "flex h-12 overflow-hidden rounded-xl border border-stone-300 bg-white transition-shadow focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20",
          className,
        )}
      >
        <span className="flex shrink-0 items-center border-r border-stone-200 bg-stone-50 px-3 text-base font-medium text-stone-600 select-none">
          +994
        </span>
        <input
          ref={ref}
          {...props}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            const local = toLocalPhoneDigits(e.target.value);
            onChange(toStoredPhone(local));
          }}
          className={cn(
            inputCls,
            "h-full rounded-none border-0 bg-transparent focus:border-0 focus:ring-0",
          )}
        />
      </div>
    );
  },
);
PhoneInput.displayName = "PhoneInput";
