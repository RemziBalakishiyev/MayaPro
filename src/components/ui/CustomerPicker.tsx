import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Plus, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { formatPhoneDisplay, phoneDigits } from "@/lib/phone";
import type { Customer } from "@/types";

interface Props {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  /** Tapılmayan axtarışla yeni müştəri — ad hazır yazılmış. */
  onCreateNew: (prefillName: string) => void;
  placeholder?: string;
  className?: string;
}

function matchesQuery(customer: Customer, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const nameOk = customer.name.toLowerCase().includes(q);
  const phoneRaw = (customer.phone || "").toLowerCase();
  const phoneOk =
    phoneRaw.includes(q) ||
    phoneDigits(customer.phone).includes(phoneDigits(q));
  return nameOk || phoneOk;
}

/**
 * Müştəri autocomplete: ad/telefon üzrə süzülən siyahı,
 * ↑↓ + Enter naviqasiyası, tapılmayanda yeni müştəri yarat.
 */
export function CustomerPicker({
  customers,
  value,
  onChange,
  onCreateNew,
  placeholder = "Müştəri axtar...",
  className,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = customers.find((c) => c.id === value);

  const filtered = useMemo(
    () => customers.filter((c) => matchesQuery(c, query)),
    [customers, query],
  );

  // Seçim dəyişəndə inputda adı göstər (axtarış açıq deyilsə)
  useEffect(() => {
    if (!open && selected) setQuery(selected.name);
    if (!open && !selected) setQuery("");
  }, [selected, open, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-idx="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const showCreateRow = query.trim().length > 0 && filtered.length === 0;
  const itemCount = showCreateRow ? 1 : filtered.length;

  const pick = (id: string) => {
    const c = customers.find((x) => x.id === id);
    onChange(id);
    setQuery(c?.name ?? "");
    setOpen(false);
  };

  const createNew = () => {
    const name = query.trim();
    setOpen(false);
    onCreateNew(name);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else if (itemCount > 0)
        setActiveIndex((i) => Math.min(itemCount - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (showCreateRow) createNew();
      else if (filtered[activeIndex]) pick(filtered[activeIndex].id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
        />
      </div>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {showCreateRow ? (
            <li role="option" aria-selected={activeIndex === 0}>
              <button
                type="button"
                data-idx={0}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={createNew}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm",
                  activeIndex === 0
                    ? "bg-emerald-50 text-emerald-800"
                    : "text-stone-700",
                )}
              >
                <Plus size={16} className="shrink-0 text-emerald-600" />
                <span>
                  «{query.trim()}» tapılmadı —{" "}
                  <span className="font-semibold">+ Yeni müştəri yarat</span>
                </span>
              </button>
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-3 text-center text-sm text-stone-500">
              Müştəri axtarın və ya yazın
            </li>
          ) : (
            filtered.map((c, i) => {
              const phone = formatPhoneDisplay(c.phone);
              const isDebt = c.remainingDebt > 0;
              const active = i === activeIndex;
              const selectedRow = c.id === value;
              return (
                <li
                  key={c.id}
                  role="option"
                  aria-selected={selectedRow || active}
                >
                  <button
                    type="button"
                    data-idx={i}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => pick(c.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition",
                      active || selectedRow
                        ? "bg-emerald-50"
                        : "hover:bg-stone-50",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-stone-900">
                        {c.name}
                      </span>
                      {phone ? (
                        <span className="block truncate text-xs tabular-nums text-stone-400">
                          {phone}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold tabular-nums",
                        isDebt ? "text-red-600" : "text-emerald-700",
                      )}
                    >
                      {isDebt ? fmtMoney(c.remainingDebt) : "borcsuz"}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
