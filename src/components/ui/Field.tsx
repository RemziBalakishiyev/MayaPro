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
      <span className="mb-1.5 block text-sm font-semibold text-stone-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block text-sm font-medium text-red-600">
          {error}
        </span>
      ) : (
        hint && (
          <span className="mt-1.5 block text-sm text-stone-500">{hint}</span>
        )
      )}
    </label>
  );
}
