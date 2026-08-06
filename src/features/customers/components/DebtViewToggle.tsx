import { useId, useRef } from "react";
import { HandCoins, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type DebtViewMode = "borclar" | "musteri";

const VIEW_SEGMENTS: {
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
 * FE#74 (AC1/AC2/AC3) — Nisyə Borclar səhifəsinin başındakı görünüş seçimi:
 * FE#40-dakı 2 böyük radio-kart ƏVƏZİNƏ BİR sətirlik seqment kontrolu. Ox
 * düymələri ilə naviqasiya (`move()`) FE#40-dan bəri DƏYİŞMƏYİB — yalnız
 * vizual dil DS-in seqmentli kontrol naxışına (`PeriodFilter`/status
 * tab-ları ilə eyni: `rounded-control` çərçivə + `rounded-chip` seqmentlər,
 * `focus-ring-inset`, `min-h-[40px]`) uyğunlaşdırılıb. İzah mətni (AC3)
 * seqmentin ALTINDA TƏK kiçik sətirdə, seçilən rejimə görə dəyişir — iki ayrı
 * böyük təsvir kartı YOXDUR.
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
    const current = VIEW_SEGMENTS.findIndex((c) => c.key === value);
    const next = (current + dir + VIEW_SEGMENTS.length) % VIEW_SEGMENTS.length;
    onChange(VIEW_SEGMENTS[next].key);
    refs.current[next]?.focus();
  };

  const activeDesc = VIEW_SEGMENTS.find((s) => s.key === value)?.desc ?? "";

  return (
    <div>
      <span id={labelId} className="sr-only">
        Görünüş
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
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
      <p className="mt-1.5 text-xs text-stone-500">{activeDesc}</p>
    </div>
  );
}
