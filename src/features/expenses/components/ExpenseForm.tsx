import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, Store, Package, type LucideIcon } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { todayISO } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { ExpenseTypeField } from "@/features/expense-types/components/ExpenseTypeField";
import { useCreateExpense, useUpdateExpense } from "../queries";
import type { Expense, ExpenseSource } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Düzəliş rejimi — dolu olanda PUT */
  initial?: Expense | null;
}

const SOURCE_CARDS: {
  key: ExpenseSource;
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    key: "general",
    label: "Ümumi xərc",
    desc: "Mağaza, təmir, defekt kimi satışa bağlı olmayan xərclər",
    Icon: Store,
  },
  {
    key: "product",
    label: "Mala bağlı xərc",
    desc: "Malın mayasına əlavə olunacaq",
    Icon: Package,
  },
];

/**
 * Mənbə seçimi — radio-kart üslubu.
 * Semantika: radiogroup + radio (aria-checked), roving tabindex və ox düymələri
 * ilə klaviatura naviqasiyası (WAI-ARIA radio group patterni).
 */
function SourcePicker({
  value,
  onChange,
}: {
  value: ExpenseSource;
  onChange: (v: ExpenseSource) => void;
}) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (dir: 1 | -1) => {
    const current = SOURCE_CARDS.findIndex((c) => c.key === value);
    const next =
      (current + dir + SOURCE_CARDS.length) % SOURCE_CARDS.length;
    onChange(SOURCE_CARDS[next].key);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <span
        id={labelId}
        className="mb-1.5 block text-sm font-semibold text-stone-700"
      >
        Xərcin mənbəyi
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {SOURCE_CARDS.map(({ key, label, desc, Icon }, idx) => {
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
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-500",
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

export function ExpenseForm({ open, onClose, initial = null }: Props) {
  const toast = useToast();
  const { data: products = [] } = useProducts();
  const createMut = useCreateExpense();
  const updateMut = useUpdateExpense();
  const editing = !!initial;

  const [source, setSource] = useState<ExpenseSource>("general");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [note, setNote] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [productError, setProductError] = useState("");
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setSource(initial.source ?? (initial.productId ? "product" : "general"));
      setTitle(initial.title);
      setCategory(initial.category);
      setAmount(String(initial.amount));
      setDate(initial.date.slice(0, 10));
      setProductId(initial.productId ?? "");
      setProductSearch("");
      setNote(initial.note || "");
    } else {
      setSource("general");
      setTitle("");
      setCategory("");
      setAmount("");
      setDate(todayISO());
      setProductId("");
      setProductSearch("");
      setNote("");
    }
    setCategoryError("");
    setProductError("");
    setDateError("");
  }, [open, initial]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
  }, [products, productSearch]);

  const pending = createMut.isPending || updateMut.isPending;

  const save = async () => {
    const n = Number(amount) || 0;
    // Bütün xətalar eyni anda göstərilir — istifadəçi bir-bir "Əlavə et"
    // basaraq növbəti xətanı kəşf etməsin.
    // Növ boş qalarsa cədvəldə boş badge, mala bağlı xərcdə isə adsız maya
    // sətri yaranır — ona görə mütləqdir.
    const catErr = category.trim() ? "" : "Xərc növü seçilməlidir";
    const prodErr =
      source === "product" && !productId ? "Mal seçimi mütləqdir" : "";
    // `max` HTML atributu klaviatura ilə yazılan tarixi bloklamır, ona görə
    // submit zamanı da yoxlanılır. Redaktədə köhnə (artıq mövcud) gələcək
    // tarixli xərc formu kilidləmir — yalnız istifadəçi tarixi YENİ gələcək
    // dəyərə dəyişəndə xəbərdarlıq olunur.
    // Tarix silinə də bilir (input boşalır) — boş dəyər backend-də 400 verir,
    // ona görə burada tutulur.
    const initialDate = initial ? initial.date.slice(0, 10) : null;
    const dateErr = !date
      ? "Tarix seçilməlidir"
      : date > todayISO() && date !== initialDate
        ? "Gələcək tarixli xərc əlavə edilə bilməz"
        : "";
    setCategoryError(catErr);
    setProductError(prodErr);
    setDateError(dateErr);
    const baseInvalid = !title.trim() || n <= 0;
    if (baseInvalid) toast.error("Xərc adı və məbləğ mütləqdir");
    if (baseInvalid || catErr || prodErr || dateErr) return;

    const payload = {
      title,
      category: category.trim(),
      amount: n,
      date,
      productId: source === "product" ? productId || null : null,
      note: note.trim() || undefined,
      source,
    };
    try {
      if (editing && initial) {
        await updateMut.mutateAsync({ id: initial.id, input: payload });
        toast.success(
          source === "product"
            ? "Xərc yeniləndi — malın real mayası yeniləndi"
            : "Xərc yeniləndi",
        );
      } else {
        await createMut.mutateAsync(payload);
        toast.success(
          source === "product"
            ? "Xərc əlavə edildi — malın real mayası yeniləndi"
            : "Xərc əlavə edildi",
        );
      }
      onClose();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : editing
            ? "Xərc yenilənmədi"
            : "Xərc əlavə edilmədi",
      );
    }
  };

  // Düymələr məzmunla birlikdə scroll etməsin deyə Drawer footer sahəsindədir.
  const footer = (
    <div className="flex items-center justify-end gap-2 border-t border-stone-100 bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <Button type="button" variant="secondary" onClick={onClose}>
        İmtina
      </Button>
      <Button
        type="button"
        onClick={() => void save()}
        disabled={pending}
        icon={<Check size={15} />}
      >
        {editing ? "Yadda saxla" : "Əlavə et"}
      </Button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      footer={footer}
      title={editing ? "Xərci düzəliş et" : "Yeni xərc"}
    >
      {(isExpanded) => (
        <div className="space-y-3">
          <SourcePicker
            value={source}
            onChange={(v) => {
              setSource(v);
              setProductError("");
            }}
          />

          <div
            className={cn(
              "grid grid-cols-1 items-start gap-3",
              // 2 sütun yalnız genişlənmiş panel + real yer olduqda (lg+).
              isExpanded && "lg:grid-cols-2",
            )}
          >
            {/* Tam sətir tutur: yanındakı "Xərc növü" də (aşağıda) col-span-2-dir,
                ona görə auto-placement bunu yarım sütunda qoysa "Xərc növü"
                növbəti sətrə keçir və bu sahənin yanında boş xana qalır. */}
            <div className={cn(isExpanded && "lg:col-span-2")}>
              <Field label="Xərc adı" required>
                <Input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Məs: Karqo çatdırılma"
                />
              </Field>
            </div>

            {/* Növ tam sətir tutur: "+ Yeni xərc növü" inline forması (input + 2
                düymə) yarım sütunda sığmır — genişlənmiş rejimdə də belədir. */}
            <div className={cn(isExpanded && "lg:col-span-2")}>
              <Field label="Xərc növü" required error={categoryError}>
                <ExpenseTypeField
                  value={category}
                  onChange={(v) => {
                    setCategory(v);
                    if (v) setCategoryError("");
                  }}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Məbləğ" required>
                <Input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Tarix" required error={dateError}>
                <Input
                  type="date"
                  max={todayISO()}
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDate(v);
                    if (v && v <= todayISO()) setDateError("");
                  }}
                />
              </Field>
            </div>

            {source === "product" && (
              <Field
                label="Hansı mala/partiyaya aiddir"
                required
                hint="Bu xərc seçilmiş malın real mayasına əlavə olunacaq."
                error={productError}
              >
                <div className="space-y-2">
                  <Input
                    aria-label="Mal axtar"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Mal axtar..."
                  />
                  <Select
                    aria-label="Mal seçimi"
                    value={productId}
                    onChange={(e) => {
                      setProductId(e.target.value);
                      if (e.target.value) setProductError("");
                    }}
                  >
                    <option value="">Seçin...</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </Field>
            )}

            <div className={cn(isExpanded && "lg:col-span-2")}>
              <Field label="Qeyd">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}
