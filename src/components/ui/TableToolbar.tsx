import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TableToolbarProps {
  /** Sol tərəf — adətən `LocalTableSearch`. */
  search?: ReactNode;
  /** Sağ tərəf — filtr düymələri, görünüş keçidləri, ixrac. */
  actions?: ReactNode;
  /** Cədvəlin altında/üstündə göstərilən say və ya «görünən cəm» sətri. */
  summary?: ReactNode;
  className?: string;
}

/**
 * FE#69 — cədvəl üstü alət zolağı.
 *
 * Bütün siyahı səhifələrində eyni yerdə (cədvəlin dərhal üstündə), eyni
 * hündürlükdə və eyni boşluqla: solda lokal axtarış, sağda əməliyyatlar.
 */
export function TableToolbar({
  search,
  actions,
  summary,
  className,
}: TableToolbarProps) {
  if (!search && !actions && !summary) return null;

  return (
    <div className={cn("mb-3 space-y-2", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {search}
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      {summary && (
        <p className="text-sm text-stone-500 tabular-nums">{summary}</p>
      )}
    </div>
  );
}
