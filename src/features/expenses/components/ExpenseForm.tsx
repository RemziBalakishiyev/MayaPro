import { useEffect, useMemo, useState } from "react";
import { Check, Store, Package } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
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
  Icon: typeof Store;
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
  const [productError, setProductError] = useState("");

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
    setProductError("");
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
    if (!title.trim() || n <= 0) {
      toast.error("Xərc adı və məbləğ mütləqdir");
      return;
    }
    if (source === "product" && !productId) {
      setProductError("Mal seçimi mütləqdir");
      return;
    }
    setProductError("");
    const payload = {
      title,
      category,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Xərci düzəliş et" : "Yeni xərc"}
    >
      <div className="space-y-3">
        <div>
          <span className="mb-1.5 block text-sm font-semibold text-stone-700">
            Xərcin mənbəyi
          </span>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {SOURCE_CARDS.map(({ key, label, desc, Icon }) => {
              const active = source === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSource(key);
                    setProductError("");
                  }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-2xl border-2 p-3 text-left transition",
                    active
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-stone-200 bg-white hover:border-stone-300",
                  )}
                >
                  <span
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

        <Field label="Xərc adı" required>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Məs: Karqo çatdırılma"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Xərc növü">
            <ExpenseTypeField value={category} onChange={setCategory} />
          </Field>
          <Field label="Məbləğ" required>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Tarix">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>

        {source === "product" && (
          <Field
            label="Hansı mala/partiyaya aiddir"
            required
            hint="Bu xərc seçilmiş malın real mayasına əlavə olunacaq."
            error={productError}
          >
            <div className="space-y-2">
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Mal axtar..."
              />
              <Select
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

        <Field label="Qeyd">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          onClick={() => void save()}
          disabled={pending}
          icon={<Check size={15} />}
        >
          {editing ? "Yadda saxla" : "Əlavə et"}
        </Button>
      </div>
    </Modal>
  );
}
