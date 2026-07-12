import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useSuppliers } from "@/features/suppliers/queries";
import { useCategories, useCreateCategory } from "@/features/categories/queries";
import { useSettingsStore } from "@/features/settings/store";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast-store";
import { calcRealCost, profitPerUnit, profitPercent, totalExpenses } from "../lib";
import { productSchema, type ProductFormValues } from "../types";
import { useCreateProduct, useUpdateProduct } from "../queries";
import type { NewProduct } from "../api";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Redaktə rejimi üçün mövcud mal; yeni mal üçün null. */
  initial: Product | null;
}

/** Xüsusiyyət adı üçün təklif siyahısı. */
const ATTR_SUGGESTIONS = ["Ölçü", "Rəng", "Model", "Material", "Marka"];
const MAX_ATTRS = 15;

const emptyValues: ProductFormValues = {
  name: "",
  image: "",
  category: "",
  attributes: [],
  barcode: "",
  purchasePrice: 0,
  salePrice: 0,
  quantity: 0,
  minStock: 10,
  currency: "AZN",
  supplierId: "",
  store: "Mağaza 1",
  warehouse: "Anbar A",
  shelf: "",
  box: "",
  note: "",
  expenses: { yol: 0, fehle: 0, yer: 0, paket: 0, diger: 0 },
};

const toFormValues = (p: Product | null): ProductFormValues => {
  if (!p) return emptyValues;
  return {
    name: p.name,
    image: p.image,
    category: p.category,
    attributes: p.attributes ?? [],
    barcode: p.barcode,
    purchasePrice: p.purchasePrice,
    salePrice: p.salePrice,
    quantity: p.quantity,
    minStock: p.minStock,
    currency: p.currency,
    supplierId: p.supplierId,
    store: p.store,
    warehouse: p.warehouse,
    shelf: p.shelf,
    box: p.box,
    note: p.note,
    expenses: { ...p.expenses },
  };
};

function CalcRow({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span
        className={`text-xs ${bold ? "font-bold text-stone-800" : "text-stone-500"}`}
      >
        {label}
      </span>
      <span
        className={`text-sm tabular-nums ${bold ? "font-bold" : "font-semibold"} ${
          tone ?? "text-stone-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** Kateqoriya seçimi + inline "yeni kateqoriya" yaratma. */
function CategoryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const toast = useToast();
  const categories = useCategories();
  const createCat = useCreateCategory();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const submitNew = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const cat = await createCat.mutateAsync(name);
      onChange(cat.name);
      setNewName("");
      setAdding(false);
      toast.success("Kateqoriya yaradıldı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kateqoriya yaradılmadı");
    }
  };

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni kateqoriya adı"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submitNew();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={submitNew}
          disabled={createCat.isPending}
          icon={<Check size={14} />}
        >
          Yarat
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdding(false);
            setNewName("");
          }}
        >
          İmtina
        </Button>
      </div>
    );
  }

  const cats = categories.data ?? [];
  // Köhnə malın kateqoriyası siyahıda yoxdursa, onu da seçim kimi saxla.
  const missing = value && !cats.some((c) => c.name === value);

  return (
    <div className="space-y-1.5">
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Seçin...</option>
        {missing && <option value={value}>{value}</option>}
        {cats.map((c) => (
          <option key={c.id} value={c.name}>
            {c.name}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="text-xs font-semibold text-emerald-700 hover:underline"
      >
        + Yeni kateqoriya
      </button>
    </div>
  );
}

export function ProductForm({ open, onClose, initial }: Props) {
  const toast = useToast();
  const defaultMinStock = useSettingsStore((s) => s.defaultMinStock);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const suppliers = useSuppliers();
  const [expensesOpen, setExpensesOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes",
  });

  useEffect(() => {
    if (!open) return;
    // Yeni mal üçün min stok default-u ayarlardan gəlir
    reset(
      initial
        ? toFormValues(initial)
        : { ...emptyValues, minStock: defaultMinStock },
    );
    setExpensesOpen(false);
  }, [open, initial, reset, defaultMinStock]);

  // Canlı hesablama
  const w = watch();
  const qty = Number(w.quantity) || 0;
  const pp = Number(w.purchasePrice) || 0;
  const sp = Number(w.salePrice) || 0;
  const totalPurchase = pp * qty;
  const totalExp = totalExpenses(w.expenses);
  const totalCost = totalPurchase + totalExp;
  const realCost = calcRealCost(pp, qty, w.expenses);
  const perUnit = profitPerUnit(sp, realCost);
  const percent = profitPercent(sp, realCost);
  const totalExpectedProfit = perUnit * qty;
  const loss = sp > 0 && realCost > 0 && sp < realCost;

  const buildLocation = (v: ProductFormValues) =>
    [v.warehouse, v.shelf && `Rəf ${v.shelf}`, v.box && `Qutu ${v.box}`]
      .filter(Boolean)
      .join(" / ");

  const onValid = async (data: ProductFormValues) => {
    // Boş xüsusiyyət sətirlərini at (ad və dəyər hər ikisi boşdursa).
    const attributes = data.attributes
      .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
      .filter((a) => a.name || a.value);
    const payload: NewProduct = {
      ...data,
      attributes,
      location: buildLocation(data) || initial?.location || "",
    };
    try {
      if (initial?.id) {
        await updateMut.mutateAsync({ id: initial.id, input: payload });
        toast.success("Mal yeniləndi");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Yeni mal əlavə edildi");
      }
      onClose();
    } catch {
      toast.error("Əməliyyat alınmadı");
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initial?.id ? "Malı redaktə et" : "Yeni mal əlavə et"}
    >
      <form onSubmit={handleSubmit(onValid)} className="space-y-5">
        <div className="space-y-3">
          <Field label="Mal adı" required error={errors.name?.message}>
            <Input {...register("name")} placeholder="Məs: Kişi cins şalvar" />
          </Field>
          <Field label="Şəkil">
            <ImageUpload
              value={w.image}
              onChange={(url) => setValue("image", url, { shouldDirty: true })}
              disabled={saving}
            />
          </Field>
          <Field label="Kateqoriya">
            <CategoryField
              value={w.category}
              onChange={(v) => setValue("category", v, { shouldDirty: true })}
            />
          </Field>

          {/* Dinamik xüsusiyyətlər */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Xüsusiyyətlər
              </h4>
              <span className="text-[11px] text-stone-400">
                {fields.length}/{MAX_ATTRS}
              </span>
            </div>
            <datalist id="attr-names">
              {ATTR_SUGGESTIONS.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {fields.length > 0 && (
              <div className="mb-2 space-y-2">
                {fields.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Input
                      list="attr-names"
                      placeholder="Ad (məs. Ölçü)"
                      className="flex-1"
                      {...register(`attributes.${idx}.name`)}
                    />
                    <Input
                      placeholder="Dəyər (məs. M)"
                      className="flex-1"
                      {...register(`attributes.${idx}.value`)}
                    />
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="shrink-0 rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Xüsusiyyəti sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              disabled={fields.length >= MAX_ATTRS}
              onClick={() => append({ name: "", value: "" })}
            >
              Xüsusiyyət əlavə et
            </Button>
          </div>

          <Field label="Barkod">
            <Input {...register("barcode")} placeholder="SDK1001" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Alış qiyməti"
              required
              error={errors.purchasePrice?.message}
            >
              <Input type="number" min="0" step="0.01" {...register("purchasePrice")} />
            </Field>
            <Field
              label="Satış qiyməti"
              required
              error={errors.salePrice?.message}
            >
              <Input type="number" min="0" step="0.01" {...register("salePrice")} />
            </Field>
            <Field label="Miqdar" required error={errors.quantity?.message}>
              <Input type="number" min="0" {...register("quantity")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valyuta">
              <Select {...register("currency")}>
                <option>AZN</option>
                <option>USD</option>
                <option>TRY</option>
              </Select>
            </Field>
            <Field label="Təchizatçı">
              <Select {...register("supplierId")}>
                <option value="">Seçin...</option>
                {(suppliers.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Anbar">
              <Input {...register("warehouse")} />
            </Field>
            <Field label="Mağaza">
              <Input {...register("store")} />
            </Field>
            <Field label="Rəf">
              <Input {...register("shelf")} placeholder="3" />
            </Field>
            <Field label="Qutu nömrəsi">
              <Input {...register("box")} placeholder="12" />
            </Field>
          </div>
          <Field label="Minimum stok">
            <Input type="number" min="0" {...register("minStock")} />
          </Field>
          <Field label="Qeyd">
            <Textarea {...register("note")} />
          </Field>
        </div>

        {/* Partiya xərcləri — accordion (default bağlı) */}
        <div className="rounded-xl border border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={() => setExpensesOpen((o) => !o)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-stone-500">
              Partiya xərcləri
              {totalExp > 0 && (
                <span className="ml-1 text-emerald-700"> · {fmtMoney(totalExp)}</span>
              )}
            </span>
            <ChevronDown
              size={18}
              className={cn(
                "text-stone-400 transition-transform",
                expensesOpen && "rotate-180",
              )}
            />
          </button>
          {expensesOpen && (
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              <Field label="Yol pulu">
                <Input type="number" min="0" {...register("expenses.yol")} />
              </Field>
              <Field label="Fəhlə pulu">
                <Input type="number" min="0" {...register("expenses.fehle")} />
              </Field>
              <Field label="Yer/anbar xərci">
                <Input type="number" min="0" {...register("expenses.yer")} />
              </Field>
              <Field label="Paket/qutu xərci">
                <Input type="number" min="0" {...register("expenses.paket")} />
              </Field>
              <Field label="Digər xərc">
                <Input type="number" min="0" {...register("expenses.diger")} />
              </Field>
            </div>
          )}
        </div>

        <div
          className={`rounded-xl border p-4 ${
            loss ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-600">
            Avtomatik hesablama
          </h4>
          <CalcRow label="Toplam alış məbləği" value={fmtMoney(totalPurchase)} />
          <CalcRow label="Toplam xərc" value={fmtMoney(totalExp)} />
          <CalcRow label="Toplam maya" value={fmtMoney(totalCost)} bold />
          <div className="my-1.5 border-t border-stone-200" />
          <CalcRow
            label="1 ədədin real mayası"
            value={fmtMoney(realCost)}
            bold
            tone="text-emerald-800"
          />
          <CalcRow
            label="1 ədəd qazanc"
            value={fmtMoney(perUnit)}
            tone={perUnit < 0 ? "text-red-600" : "text-emerald-700"}
          />
          <CalcRow
            label="Ümumi gözlənilən qazanc"
            value={fmtMoney(totalExpectedProfit)}
            tone={totalExpectedProfit < 0 ? "text-red-600" : "text-emerald-700"}
          />
          <CalcRow
            label="Mənfəət faizi"
            value={`${percent.toFixed(1)} %`}
            bold
            tone={percent < 0 ? "text-red-600" : "text-emerald-700"}
          />
          {loss && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700">
              <AlertTriangle size={14} /> Satış qiyməti real mayadan aşağıdır — bu
              qiymətə ziyana satırsınız!
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-stone-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            İmtina
          </Button>
          <Button type="submit" disabled={saving} icon={<Check size={15} />}>
            {initial?.id ? "Yadda saxla" : "Malı əlavə et"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
