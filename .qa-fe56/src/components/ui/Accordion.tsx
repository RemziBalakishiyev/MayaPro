import { useId } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface AccordionProps {
  /** Solda göstərilən bölmə ikonu (opsional). */
  icon?: LucideIcon;
  title: string;
  /** Bölmə doldurulubsa başlıqda görünən qısa xülasə, məs. "380 ₼" və ya "Anbar A, Rəf 3". */
  summary?: string | null;
  /** Başlıq altında görünən qısa izah — bölmə boşdursa istifadəçiyə nə yazılacağını göstərir. */
  desc?: string | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * Ortaq açılıb-bağlanan bölmə komponenti.
 *
 * Texnologiyaya öyrəşməmiş istifadəçi üçün bağlı vəziyyət açıq-aşkar "düymə"
 * kimi görünür: tam enli, sərhədli, ikon + qalın başlıq + (varsa) xülasə,
 * sağda mətnli "Aç / Bağla" göstəricisi. Açılma grid-template-rows keçidi ilə
 * yumşaqdır və məzmun DOM-dan çıxarılmır (RHF sahələri unmount olmur).
 */
export function Accordion({
  icon: Icon,
  title,
  summary,
  desc,
  open,
  onToggle,
  children,
  className,
}: AccordionProps) {
  const bodyId = useId();
  return (
    <section
      className={cn(
        "rounded-xl border border-stone-200 bg-stone-50",
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex w-full items-start gap-2.5 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      >
        {Icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Icon size={16} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-stone-900">
            {title}
            {summary && (
              <span className="font-normal text-stone-500"> · {summary}</span>
            )}
          </h3>
          {desc && <p className="text-xs text-stone-500">{desc}</p>}
        </div>
        <span className="mt-0.5 shrink-0 whitespace-nowrap text-xs font-bold text-emerald-700">
          {open ? "Bağla ⌃" : "Aç ⌄"}
        </span>
      </button>
      <div
        id={bodyId}
        aria-hidden={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-4 pb-4">{children}</div>
        </div>
      </div>
    </section>
  );
}
