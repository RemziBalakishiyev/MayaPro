import { useId, useRef } from "react";
import { Wallet, Clock, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type EmployeesViewMode = "maaslar" | "faaliyyet";

const VIEW_SEGMENTS: { key: EmployeesViewMode; label: string; Icon: LucideIcon }[] = [
  { key: "maaslar", label: "Maaşlar", Icon: Wallet },
  { key: "faaliyyet", label: "Fəaliyyət", Icon: Clock },
];

/**
 * FE#79 (AC-1) — "İşçilər" səhifəsinin rejim seçimi: Nisyə Borclar
 * səhifəsindəki (`DebtViewToggle`) EYNİ seqmentli vizual/interaktiv dildə
 * (`rounded-control` xarici çərçivə + `rounded-chip` seqmentlər, aktiv
 * seqment `bg-emerald-700 text-white`, `min-h-[40px]`, ox düymələri ilə
 * keçid). Semantika `role="tablist"`/`role="tab"`/`aria-selected` — bu iki
 * rejim səhifənin MƏZMUNUNU (Maaşlar ⇄ Fəaliyyət) dəyişdirir, ona görə
 * `DebtViewToggle`-dəki `radiogroup`/`radio` (eyni cədvəlin filtri) əvəzinə
 * tab semantikası düzgündür.
 */
export function EmployeesViewToggle({
  value,
  onChange,
}: {
  value: EmployeesViewMode;
  onChange: (v: EmployeesViewMode) => void;
}) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (dir: 1 | -1) => {
    const current = VIEW_SEGMENTS.findIndex((c) => c.key === value);
    const next = (current + dir + VIEW_SEGMENTS.length) % VIEW_SEGMENTS.length;
    onChange(VIEW_SEGMENTS[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <span id={labelId} className="sr-only">
        İşçilər görünüşü
      </span>
      <div
        role="tablist"
        aria-labelledby={labelId}
        aria-label="İşçilər görünüşü"
        className="inline-flex w-full min-w-0 flex-nowrap gap-0.5 rounded-control border border-stone-200 bg-white p-1 sm:w-auto"
      >
        {VIEW_SEGMENTS.map(({ key, label, Icon }, idx) => {
          const active = value === key;
          return (
            <button
              key={key}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(key)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  move(1);
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  move(-1);
                }
              }}
              className={cn(
                "focus-ring-inset inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-chip px-3.5 text-sm font-semibold transition-colors sm:flex-initial",
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-50 hover:text-stone-900",
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
