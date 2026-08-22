import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input, type InputProps } from "./Input";

export type PasswordInputProps = Omit<InputProps, "type">;

/**
 * FE#187 — şifrə inputu, sağda "göz" ikonu ilə göstər/gizlət toqqli.
 *
 * Basılı halda `type="text"` olur (şifrə açıq mətn kimi görünür), aria-label
 * vəziyyətə görə dəyişir ("Şifrəni göstər" / "Şifrəni gizlət") ki, ekran
 * oxuyucusu düyməni düzgün elan etsin. Toqql düyməsinin toxunma sahəsi
 * mobil üçün minimum 44px-dir.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Şifrəni gizlət" : "Şifrəni göstər"}
          aria-pressed={visible}
          className="focus-ring absolute inset-y-0 right-0 flex min-h-[44px] w-11 items-center justify-center text-stone-400 transition-colors hover:text-stone-600"
        >
          {visible ? (
            <EyeOff size={20} aria-hidden />
          ) : (
            <Eye size={20} aria-hidden />
          )}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
