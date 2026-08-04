import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface TablePaginationProps {
  /** Görünən ilk sətrin nömrəsi (1-dən). */
  from: number;
  /** Görünən son sətrin nömrəsi. */
  to: number;
  /** Ümumi sətir sayı. */
  total: number;
  canPrevious: boolean;
  canNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

const navBtn =
  "focus-ring inline-flex min-h-[44px] items-center gap-1.5 rounded-control bg-white px-4 text-base font-semibold text-stone-700 ring-1 ring-stone-300 transition-colors hover:bg-stone-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

/**
 * FE#69 — cədvəl səhifələməsi (`DataTable` daxilindən ayrılmış paylaşılan
 * primitiv). Düymələr 44px, vahid fokus halqası, sayğac `tabular-nums`.
 */
export function TablePagination({
  from,
  to,
  total,
  canPrevious,
  canNext,
  onPrevious,
  onNext,
  className,
}: TablePaginationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-1 text-sm text-stone-500",
        className,
      )}
    >
      <span className="tabular-nums">
        {from}-dən {to}-yə, cəmi {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canPrevious}
          title={canPrevious ? "Əvvəlki səhifə" : "Bu, ilk səhifədir"}
          className={navBtn}
        >
          <ChevronLeft size={16} aria-hidden />
          Əvvəlki
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          title={canNext ? "Növbəti səhifə" : "Bu, son səhifədir"}
          className={navBtn}
        >
          Növbəti
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
