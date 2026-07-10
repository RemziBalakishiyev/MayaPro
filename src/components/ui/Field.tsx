import type { ReactNode } from "react";

export interface FieldProps {
  label: ReactNode;
  children: ReactNode;
  /** Kömək mətni (error yoxdursa göstərilir) */
  hint?: ReactNode;
  required?: boolean;
  /** React Hook Form validasiya xətası */
  error?: string;
}

/** Form sahəsi: label + input slot + hint/error mesajı. */
export function Field({ label, children, hint, required, error }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-red-600">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>
      )}
    </label>
  );
}
