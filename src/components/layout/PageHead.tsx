interface PageHeadProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/** Səhifə başlığı — hər route-un yuxarısında istifadə olunur. */
export function PageHead({ title, subtitle, actions }: PageHeadProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 lg:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-base text-stone-500">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
