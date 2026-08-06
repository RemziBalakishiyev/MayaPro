import { cn } from "@/lib/cn";

export interface SkeletonProps {
  className?: string;
}

/**
 * FE#69 — vahid yükləmə skeleti (F-41).
 * Sonsuz spinner əvəzinə məzmunun formasını təqlid edən boz bloklar:
 * yükləndikdən sonra düzülüş SIÇRAMIR.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-chip bg-stone-200", className)}
    />
  );
}

export interface SkeletonTextProps {
  /** Sətir sayı (defolt 3). */
  lines?: number;
  className?: string;
}

/** Mətn blokunun skeleti — sonuncu sətir qısa. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export interface TableSkeletonProps {
  /** Sətir sayı (defolt 5). */
  rows?: number;
  /** Sütun sayı (defolt 4). */
  columns?: number;
  className?: string;
}

/**
 * Cədvəl gövdəsi üçün skelet — `DataTable` daxilində istifadə olunur.
 * Başlıq sətri həqiqi cədvəldə yerində qaldığı üçün burada yalnız gövdə var.
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Məlumat yüklənir"
      className={cn("divide-y divide-stone-100", className)}
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-3 px-3 py-4">
          {Array.from({ length: columns }).map((__, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 ? "max-w-[40%]" : "max-w-[20%]")}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Məlumat yüklənir...</span>
    </div>
  );
}
