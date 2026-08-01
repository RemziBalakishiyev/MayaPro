import { useId, useRef } from "react";
import { HandCoins, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type DebtViewMode = "borclar" | "musteri";

const VIEW_CARDS: {
  key: DebtViewMode;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "borclar",
    label: "Borclar",
    desc: "Hər açıq borc mənbəyi ayrı sətirdə (ilkin borc + qalıqlı satışlar)",
    Icon: HandCoins,
  },
  {
    key: "musteri",
    label: "Müştəri üzrə",
    desc: "Hər müştərinin cəmi qalıq borcu",
    Icon: Users,
  },
];

/**
 * FE#40 — Nisyə Borclar səhifəsinin başındakı 2 böyük görünüş kartı. Seçim
 * `ExpenseForm`-dakı mənbə seçimi (`SourcePicker`) ilə eyni radio-kart
 * naxışını təkrarlayır ki, tətbiqdə vahid bir görünüş üslubu qalsın.
 */
export function DebtViewToggle({
  value,
  onChange,
}: {
  value: DebtViewMode;
  onChange: (v: DebtViewMode) => void;
}) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (dir: 1 | -1) => {
    const current = VIEW_CARDS.findIndex((c) => c.key === value);
    const next = (current + dir + VIEW_CARDS.length) % VIEW_CARDS.length;
    onChange(VIEW_CARDS[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div className="mb-4">
      <span id={labelId} className="sr-only">
        Görünüş
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {VIEW_CARDS.map(({ key, label, desc, Icon }, idx) => {
          const active = value === key;
          return (
            <button
              key={key}
              ref={(el) => {
                refs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
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
                "flex items-start gap-2.5 rounded-2xl border-2 p-3.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20",
                active
                  ? "border-emerald-600 bg-emerald-50"
                  : "border-stone-200 bg-white hover:border-stone-300",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-500",
                )}
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-base font-bold",
                    active ? "text-emerald-800" : "text-stone-800",
                  )}
                >
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-stone-500">
                  {desc}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
