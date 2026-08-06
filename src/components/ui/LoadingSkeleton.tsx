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

export interface PageSkeletonProps {
  /** Ekran oxuyucusu üçün elan (məs. "Dashboard yüklənir"). */
  label: string;
  /** Üst KPI kart sayı (defolt 6). */
  statCount?: number;
  /** KPI kartları üçün grid sütun sinifləri. */
  statGridClassName?: string;
  /** Alt böyük kart sayı (defolt 2). */
  cardCount?: number;
  /** Alt kartlar üçün grid sütun sinifləri. */
  cardGridClassName?: string;
  /** Alt kartların hündürlüyü. */
  cardHeightClassName?: string;
}

/**
 * FE#142 — tam səhifə (Dashboard/Hesabatlar tipli) yüklənmə skeleti: KPI
 * kart cərgəsi + altında böyük kartlar. `TableSkeleton`-la eyni naxış —
 * sonsuz spinner əvəzinə məzmunun formasını təqlid edir, düzülüş sıçramır.
 */
export function PageSkeleton({
  label,
  statCount = 6,
  statGridClassName = "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
  cardCount = 2,
  cardGridClassName = "lg:grid-cols-2",
  cardHeightClassName = "h-64",
}: PageSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="space-y-5"
    >
      <div className={cn("grid gap-3", statGridClassName)}>
        {Array.from({ length: statCount }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <div className={cn("grid gap-4", cardGridClassName)}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <Skeleton key={i} className={cardHeightClassName} />
        ))}
      </div>
      <span className="sr-only">{label}...</span>
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
