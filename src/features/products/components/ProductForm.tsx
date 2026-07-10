import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Check } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { db } from "@/mocks/db";
import { useSettingsStore } from "@/features/settings/store";
import { fmtMoney } from "@/lib/format";
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

const emptyValues: ProductFormValues = {
  name: "",
  image: "",
  category: "",
  model: "",
  size: "",
  color: "",
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
    model: p.model,
    size: p.size,
    color: p.color,
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

export function ProductForm({ open, onClose, initial }: Props) {
  const toast = useToast();
  const defaultMinStock = useSettingsStore((s) => s.defaultMinStock);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const suppliers = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => db.suppliers.list(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) return;
    // Yeni mal üçün min stok default-u ayarlardan gəlir
    reset(
      initial
        ? toFormValues(initial)
        : { ...emptyValues, minStock: defaultMinStock },
    );
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
    const payload: NewProduct = {
      ...data,
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
          <Field label="Şəkil URL">
            <Input {...register("image")} placeholder="https://... və ya boş" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kateqoriya">
              <Input {...register("category")} placeholder="Şalvar" />
            </Field>
            <Field label="Model">
              <Input {...register("model")} />
            </Field>
            <Field label="Ölçü">
              <Input {...register("size")} placeholder="30-38" />
            </Field>
            <Field label="Rəng">
              <Input {...register("color")} />
            </Field>
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

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
            Partiya xərcləri
          </h4>
          <div className="grid grid-cols-2 gap-3">
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
