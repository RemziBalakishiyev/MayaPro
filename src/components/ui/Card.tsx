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
        "rounded-xl border border-stone-200 bg-white shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          <h3 className="text-sm font-bold text-stone-800">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
