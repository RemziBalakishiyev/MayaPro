import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { todayISO } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { EXP_CATS } from "../lib";
import { useCreateExpense } from "../queries";
import type { ExpenseCategory } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ExpenseForm({ open, onClose }: Props) {
  const toast = useToast();
  const { data: products = [] } = useProducts();
  const createMut = useCreateExpense();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("Yol");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setCategory("Yol");
      setAmount("");
      setDate(todayISO());
      setProductId("");
      setProductSearch("");
      setNote("");
    }
  }, [open]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
  }, [products, productSearch]);

  const save = async () => {
    const n = Number(amount) || 0;
    if (!title.trim() || n <= 0) {
      toast.error("Xərc adı və məbləğ mütləqdir");
      return;
    }
    try {
      await createMut.mutateAsync({
        title,
        category,
        amount: n,
        date,
        productId: productId || null,
        note: note.trim() || undefined,
      });
      toast.success(
        productId
          ? "Xərc əlavə edildi — malın real mayası yeniləndi"
          : "Xərc əlavə edildi",
      );
      onClose();
    } catch {
      toast.error("Xərc əlavə edilmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni xərc">
      <div className="space-y-3">
        <Field label="Xərc adı" required>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Məs: Karqo çatdırılma"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kateqoriya">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {EXP_CATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
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
        <Field
          label="Hansı mala/partiyaya aiddir"
          hint="Seçilsə, bu xərc malın real mayasına əlavə olunacaq."
        >
          <div className="space-y-2">
            <Input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Mal axtar..."
            />
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">Ümumi xərc (mala bağlı deyil)</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
        </Field>
        <Field label="Qeyd">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          onClick={save}
          disabled={createMut.isPending}
          icon={<Check size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
