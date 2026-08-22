import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  /** Checkbox altında/yanında kiçik izah mətni (məs. "Bu cihazda 30 gün yadda qalacaq"). */
  description?: ReactNode;
}

/**
 * FE#187 — böyük, toxunula bilən checkbox (mobil hədəf ≥44px hündürlük).
 *
 * Native `<input type="checkbox">` əlçatanlıq üçün saxlanılır (klaviatura,
 * screen-reader, react-hook-form `register()` ilə birbaşa uyğun gəlir);
 * vizual qutu CSS-lə (`peer` + `appearance-none`) çəkilir. Bütün `label`
 * toxunma sahəsidir — mətnə toxunmaq da checkbox-ı dəyişir.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          "flex min-h-[44px] cursor-pointer select-none items-start gap-3 rounded-control py-1",
          className,
        )}
      >
        <span className="relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md border-2 border-stone-300 bg-white outline-none transition-colors checked:border-emerald-600 checked:bg-emerald-600 focus-visible:ring-4 focus-visible:ring-emerald-500/20"
            {...props}
          />
          <Check
            size={16}
            strokeWidth={3}
            aria-hidden
            className="pointer-events-none relative hidden text-white peer-checked:block"
          />
        </span>
        {(label || description) && (
          <span className="pt-0.5 text-sm leading-snug">
            {label && (
              <span className="block font-semibold text-stone-800">
                {label}
              </span>
            )}
            {description && (
              <span className="mt-0.5 block text-stone-500">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
