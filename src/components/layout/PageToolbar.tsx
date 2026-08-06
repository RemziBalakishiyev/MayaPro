import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageToolbarProps {
  /** Sol tərəf — dövr/tarix filtri (`SegmentedDateFilter`). */
  period?: ReactNode;
  /** Orta — lokal cədvəl axtarışı / filtr qabığı. */
  filters?: ReactNode;
  /** Sağ tərəf — görünüş keçidləri, ixrac və s. */
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * FE#69 — səhifə alətlər zolağı (AC-16).
 *
 * Filtr və tarix kontrolları HƏR səhifədə eyni yerdə olsun deyə: başlığın
 * altında, kontentdən əvvəl, eyni boşluqla. Slot-lar boşdursa heç nə render
 * olunmur — mövcud səhifələr bu zolağa mərhələli köçürülə bilər.
 */
export function PageToolbar({
  period,
  filters,
  trailing,
  children,
  className,
}: PageToolbarProps) {
  const hasContent =
    Boolean(period) || Boolean(filters) || Boolean(trailing) || Boolean(children);
  if (!hasContent) return null;

  return (
    <div className={cn("mb-4 space-y-3", className)}>
      {(period || trailing) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {period && <div className="min-w-0 flex-1">{period}</div>}
          {trailing && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {trailing}
            </div>
          )}
        </div>
      )}
      {filters}
      {children}
    </div>
  );
}
