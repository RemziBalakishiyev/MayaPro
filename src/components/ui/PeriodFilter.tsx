import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputCls } from "@/components/ui/Input";
import {
  QUICK_PERIODS,
  formatRangeChip,
  isoInRange,
  last12Months,
  matchQuickPeriod,
  monthRange,
  quickPeriodRange,
  validateRange,
  type PeriodRange,
  type QuickPeriodKey,
} from "@/components/ui/period-filter-lib";

export type { PeriodRange, QuickPeriodKey };

/**
 * FE#86 qeydi: köhnə issue-larda adı çəkilən `PageToolbar` komponenti kod
 * bazasında heç vaxt mövcud olmayıb — bu `PeriodFilter` (tarix aralığı) və
 * `FilterBar` (axtarış + filtr paneli) FE#69-dan bəri onun funksional
 * ekvivalentidir və artıq Mallar/Xərclər/Borclar/Satış səhifələrində
 * istifadə olunur.
 */
export interface PeriodFilterProps {
  /** URL search params-dan gələn cari aralıq (from/to). Mənbə həqiqətdir. */
  value: PeriodRange;
  /** Yeni aralıq seçiləndə çağrılır — çağıran tərəf URL-i yeniləyir. */
  onChange: (range: PeriodRange) => void;
  /**
   * URL-də from/to yoxdursa ilk mount-da tətbiq olunacaq açar (AC2).
   * "all" — heç nə yazılmır (Hamısı artıq boş aralıqla eyni məna daşıyır).
   */
  defaultKey?: QuickPeriodKey;
  className?: string;
}

const chipCls = (active: boolean) =>
  cn(
    "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
    active
      ? "bg-emerald-700 text-white shadow-sm"
      : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
  );

/**
 * Paylaşılan dövr filtri (FE#56) — Mallar/Satış jurnalı/Nisyə Borclar/Xərclər
 * səhifələrində eyni "Bu gün · Bu həftə · Bu ay · Keçən ay · Bu il · Hamısı"
 * çip sırası + "Tarix seç" popover (son 12 ay siyahısı və ya sərbəst aralıq).
 * Dəyər tam olaraq `value`/`onChange` (URL search params) üzərindən idarə
 * olunur — komponent özü heç bir gizli state saxlamır (deep-link dəstəyi).
 */
export function PeriodFilter({
  value,
  onChange,
  defaultKey = "all",
  className,
}: PeriodFilterProps) {
  const popoverId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  // Klaviatura ilə naviqasiya: popover açılanda fokus içərisinə (birinci ay
  // düyməsinə) keçir, bağlananda "Tarix seç" çipinə qaytarılır — portal
  // document.body-yə render olunduğu üçün defolt Tab sırası fokusu itirər.
  const setPopoverRef = (el: HTMLDivElement | null) => {
    popRef.current = el;
    if (el) {
      const first = el.querySelector<HTMLElement>("button, input");
      (first ?? el).focus();
    } else {
      triggerRef.current?.focus();
    }
  };
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasNoRange = value.from == null && value.to == null;

  // AC2 — heç bir URL param yoxdursa səhifənin defolt dövrü URL-ə yazılır.
  // Yalnız ilk mount-da: istifadəçi sonra şüurlu "Hamısı" seçə bilməlidir.
  useEffect(() => {
    if (defaultKey !== "all" && hasNoRange) {
      onChange(quickPeriodRange(defaultKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeKey = matchQuickPeriod(value);
  const isCustom = activeKey === null && !hasNoRange;

  useEffect(() => {
    if (!open) return;
    setDraftFrom(isCustom ? (value.from ?? "") : "");
    setDraftTo(isCustom ? (value.to ?? "") : "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = 300;
      const popH = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow < popH && rect.top > popH
          ? Math.max(8, rect.top - popH - 4)
          : rect.bottom + 4;
      const left = Math.max(
        8,
        Math.min(rect.left, window.innerWidth - width - 8),
      );
      setCoords({ top, left });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const applyCustom = () => {
    const err = validateRange(draftFrom, draftTo);
    if (err) {
      setError(err);
      return;
    }
    onChange({ from: draftFrom, to: draftTo });
    setOpen(false);
  };

  const clearCustom = () => {
    onChange({});
    setOpen(false);
  };

  const monthOptions = last12Months();

  const popover =
    open && coords
      ? createPortal(
          <div
            ref={setPopoverRef}
            id={popoverId}
            role="dialog"
            aria-label="Tarix aralığı seç"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              width: 300,
              zIndex: 70,
            }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg"
          >
            <div className="max-h-52 overflow-y-auto border-b border-stone-100 p-1.5">
              {monthOptions.map((mo) => {
                const r = monthRange(mo.ym);
                const active = value.from === r.from && value.to === r.to;
                return (
                  <button
                    key={mo.ym}
                    type="button"
                    onClick={() => {
                      onChange(r);
                      setOpen(false);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                      active
                        ? "bg-emerald-50 text-emerald-800"
                        : "text-stone-700 hover:bg-stone-50",
                    )}
                  >
                    {mo.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
                Sərbəst aralıq
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Başlanğıc
                  </label>
                  <input
                    type="date"
                    aria-label="Başlanğıc tarix"
                    value={draftFrom}
                    onChange={(e) => {
                      setDraftFrom(e.target.value);
                      setError(null);
                    }}
                    className={cn(inputCls, "h-9 px-2 text-sm")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-stone-500">
                    Son
                  </label>
                  <input
                    type="date"
                    aria-label="Son tarix"
                    value={draftTo}
                    onChange={(e) => {
                      setDraftTo(e.target.value);
                      setError(null);
                    }}
                    className={cn(inputCls, "h-9 px-2 text-sm")}
                  />
                </div>
              </div>
              {error && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={applyCustom}
                className="mt-1 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
              >
                Tətbiq et
              </button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div
      role="tablist"
      aria-label="Dövr"
      className={cn(
        "flex w-full min-w-0 flex-nowrap items-center gap-0.5 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1",
        className,
      )}
    >
      {QUICK_PERIODS.map(({ key, label }) => {
        const active = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(quickPeriodRange(key))}
            className={chipCls(active)}
          >
            {label}
          </button>
        );
      })}

      <button
        ref={triggerRef}
        type="button"
        role="tab"
        aria-selected={isCustom}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(chipCls(isCustom), "inline-flex items-center gap-1.5")}
      >
        <Calendar size={14} />
        {isCustom && value.from && value.to
          ? formatRangeChip(value.from, value.to)
          : "Tarix seç"}
        {isCustom && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Tarix aralığını təmizlə"
            onClick={(e) => {
              e.stopPropagation();
              clearCustom();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                clearCustom();
              }
            }}
            className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-black/10"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {popover}
    </div>
  );
}

/** Sətri from/to aralığında olub-olmadığını yoxlayır — cədvəl/list client-side filtri üçün. */
export { isoInRange };
