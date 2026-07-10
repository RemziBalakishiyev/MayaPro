import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200 bg-white shadow-card",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h3 className="text-base font-bold text-stone-800">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
