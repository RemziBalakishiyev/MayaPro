import type { ReactNode } from "react";
import { Package, type LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon = Package,
  title,
  hint,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
      <div className="mb-3 rounded-full bg-stone-200 p-4 text-stone-500">
        <Icon size={26} />
      </div>
      <p className="text-base font-bold text-stone-700">{title}</p>
      {hint && <p className="mt-1.5 max-w-xs text-sm text-stone-500">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
