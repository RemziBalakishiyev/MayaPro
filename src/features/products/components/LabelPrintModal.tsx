import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  Barcode as BarcodeIcon,
  Loader2,
  Printer,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { todayISO } from "@/lib/format";
import { downloadFilePost } from "@/lib/download";
import { useGenerateBarcode } from "../queries";
import type { Product } from "@/types";

/** Backend limiti — bir dəfəyə çap oluna biləcək ən çox etiket sayı. */
const MAX_LABELS = 500;

type LabelType = "barcode" | "qr";

interface LabelRow {
  productId: string;
  /** Sərbəst yazıla bilsin deyə string saxlanılır — hesablamada clamp olunur. */
  countStr: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  products: Product[];
  /**
   * Cədvəldəki tez-çap ikonundan açılanda əvvəlcədən 1 ədədlə seçilmiş mal.
   * Başlıq düyməsindən açılanda null.
   */
  preselected?: Product | null;
}

/** Say sətri → 1-dən kiçik olmayan tam ədəd (boş/0/mənfi → 1). */
const clampCount = (raw: string): number => Math.max(1, Math.floor(Number(raw)) || 1);

/**
 * Mal axtarışlı əlavə düyməsi — CustomerPicker naxışının sadələşdirilmiş
 * variantı: seçim edildikdən sonra sətrə düşür, axtarış təmizlənir ki,
 * ardıcıl bir neçə mal əlavə etmək rahat olsun.
 */
function ProductPicker({
  products,
  onPick,
}: {
  products: Product[];
  onPick: (p: Product) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.barcode.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [products, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (p: Product) => {
    onPick(p);
    setQuery("");
    setActiveIndex(0);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown") setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) pick(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className="relative">
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
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Mal axtar (ad və ya barkod)..."
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
          aria-label="Etiket üçün mal axtar"
          className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
        />
      </div>

      {showList && (
        <ul
          role="listbox"
          className="absolute z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-3 text-center text-sm text-stone-500">
              Mal tapılmadı
            </li>
          ) : (
            filtered.map((p, i) => (
              <li key={p.id} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(p)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left",
                    i === activeIndex ? "bg-emerald-50" : "hover:bg-stone-50",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-900">
                    {p.name}
                  </span>
                  {p.barcode ? (
                    <span className="shrink-0 text-xs tabular-nums text-stone-400">
                      {p.barcode}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-red-600">
                      barkod yoxdur
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

const TYPE_CARDS: {
  key: LabelType;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "barcode",
    label: "Barkod",
    desc: "Xətli barkod (Code128)",
    Icon: BarcodeIcon,
  },
  {
    key: "qr",
    label: "QR kod",
    desc: "Kvadrat QR kod",
    Icon: QrCode,
  },
];

/** Etiket növü seçimi — radio-kart üslubu (ExpenseForm-dakı SourcePicker naxışı). */
function TypePicker({
  value,
  onChange,
}: {
  value: LabelType;
  onChange: (v: LabelType) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (dir: 1 | -1) => {
    const current = TYPE_CARDS.findIndex((c) => c.key === value);
    const next = (current + dir + TYPE_CARDS.length) % TYPE_CARDS.length;
    onChange(TYPE_CARDS[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label="Etiket növü" className="grid grid-cols-2 gap-2.5">
      {TYPE_CARDS.map(({ key, label, desc, Icon }, idx) => {
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
              "flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/20",
              active
                ? "border-emerald-600 bg-emerald-50"
                : "border-stone-200 bg-white hover:border-stone-300",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                active ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500",
              )}
            >
              <Icon size={18} />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-sm font-bold",
                  active ? "text-emerald-800" : "text-stone-800",
                )}
              >
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-stone-500">{desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Barkod/QR etiket çapı modalı — mal seçimi (axtarışla), barkodsuz mallar
 * üçün "Barkod yarat" mini əməliyyatı, növ seçimi və PDF hazırlama.
 * Yalnız real backend rejimində açılır (`_app.mallar.tsx`-də USE_MOCK yoxlanılır).
 */
export function LabelPrintModal({ open, onClose, products, preselected }: Props) {
  const toast = useToast();
  const generateMut = useGenerateBarcode();
  const [rows, setRows] = useState<LabelRow[]>([]);
  const [type, setType] = useState<LabelType>("barcode");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows(preselected ? [{ productId: preselected.id, countStr: "1" }] : []);
    setType("barcode");
    setGeneratingId(null);
  }, [open, preselected]);

  // Sətirlərin mal məlumatı canlı siyahıdan gəlir — barkod yaradıldıqdan
  // sonra ["products"] invalidate olanda sətir avtomatik yenilənir.
  const rowsWithProduct = useMemo(
    () =>
      rows
        .map((r) => ({ ...r, product: products.find((p) => p.id === r.productId) }))
        .filter(
          (r): r is LabelRow & { product: Product } => r.product !== undefined,
        ),
    [rows, products],
  );

  const totalCount = rowsWithProduct.reduce(
    (sum, r) => sum + clampCount(r.countStr),
    0,
  );
  const overLimit = totalCount > MAX_LABELS;

  const addProduct = (product: Product) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.productId === product.id);
      if (idx >= 0) {
        // Eyni mal ikinci dəfə seçilərsə sətri təkrarlamırıq — sayını 1 artırırıq.
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          countStr: String(clampCount(next[idx].countStr) + 1),
        };
        return next;
      }
      return [...prev, { productId: product.id, countStr: "1" }];
    });
  };

  const updateCount = (productId: string, raw: string) => {
    setRows((prev) =>
      prev.map((r) => (r.productId === productId ? { ...r, countStr: raw } : r)),
    );
  };

  const normalizeCount = (productId: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.productId === productId
          ? { ...r, countStr: String(clampCount(r.countStr)) }
          : r,
      ),
    );
  };

  const removeRow = (productId: string) =>
    setRows((prev) => prev.filter((r) => r.productId !== productId));

  const handleGenerate = async (product: Product) => {
    setGeneratingId(product.id);
    try {
      await generateMut.mutateAsync(product.id);
      toast.success(`Barkod yaradıldı: ${product.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Barkod yaradılmadı");
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePrint = async () => {
    if (rowsWithProduct.length === 0 || overLimit) return;
    setSubmitting(true);
    try {
      const items = rowsWithProduct.map((r) => ({
        productId: r.productId,
        count: clampCount(r.countStr),
      }));
      await downloadFilePost(
        "/api/exports/products/labels.pdf",
        { items, type },
        `etiketler-${todayISO()}.pdf`,
      );
      toast.success("Etiket PDF-i hazırlandı");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "PDF hazırlanmadı");
    } finally {
      setSubmitting(false);
    }
  };

  const pdfDisabled = rowsWithProduct.length === 0 || overLimit || submitting;

  const footer = (
    <div className="flex flex-col gap-3 border-t border-stone-100 bg-white px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-stone-500">Cəmi etiket sayı</p>
        <p
          className={cn(
            "text-xl font-bold tabular-nums",
            overLimit ? "text-red-600" : "text-stone-900",
          )}
        >
          {totalCount} / {MAX_LABELS}
        </p>
        {overLimit && (
          <p className="mt-0.5 text-xs font-semibold text-red-600">
            Bir dəfəyə ən çoxu {MAX_LABELS} etiket çap etmək olar
          </p>
        )}
      </div>
      <Button
        onClick={() => void handlePrint()}
        disabled={pdfDisabled}
        icon={
          submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Printer size={16} />
          )
        }
        className="w-full sm:w-auto"
      >
        {submitting ? "Hazırlanır..." : "PDF hazırla"}
      </Button>
    </div>
  );

  return (
    <Drawer open={open} onClose={onClose} title="Barkod/QR etiket çapı" footer={footer}>
      <div className="space-y-5">
        <section>
          <h4 className="mb-2 text-sm font-bold text-stone-900">Mal seçimi</h4>
          <ProductPicker products={products} onPick={addProduct} />

          <div className="mt-3">
            {rowsWithProduct.length === 0 ? (
              <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                Hələ mal seçilməyib. Yuxarıdan axtarıb əlavə edin.
              </p>
            ) : (
              <ul className="space-y-2">
                {rowsWithProduct.map((row) => (
                  <li
                    key={row.productId}
                    className="flex flex-col gap-2 rounded-xl border border-stone-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900">
                        {row.product.name}
                      </p>
                      {row.product.barcode ? (
                        <p className="truncate text-xs tabular-nums text-stone-500">
                          {row.product.barcode}
                        </p>
                      ) : (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-semibold text-red-600">
                            Barkod yoxdur
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleGenerate(row.product)}
                            disabled={generatingId === row.productId}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {generatingId === row.productId ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <BarcodeIcon size={12} />
                            )}
                            Barkod yarat
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={row.countStr}
                        onChange={(e) => updateCount(row.productId, e.target.value)}
                        onBlur={() => normalizeCount(row.productId)}
                        aria-label={`${row.product.name} — etiket sayı`}
                        className="h-10 w-20 rounded-lg border border-stone-300 bg-white px-2 text-center text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(row.productId)}
                        aria-label={`${row.product.name} sətrini sil`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-sm font-bold text-stone-900">Etiket növü</h4>
          <TypePicker value={type} onChange={setType} />
        </section>
      </div>
    </Drawer>
  );
}
