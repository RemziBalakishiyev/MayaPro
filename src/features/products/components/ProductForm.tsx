import { useEffect } from "react";
import type { ReactNode } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Coins,
  MapPin,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useSuppliers } from "@/features/suppliers/queries";
import { CategoryField } from "@/features/categories/components/CategoryField";
import { useSettingsStore } from "@/features/settings/store";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/toast-store";
import { ExpenseRows } from "@/components/ui/ExpenseRows";
import {
  calcRealCost,
  mergeExpenseLines,
  profitPerUnit,
  profitPercent,
} from "../lib";
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
  store: "",
  warehouse: "",
  shelf: "",
  box: "",
  note: "",
  expenses: [],
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
    expenses: (p.expenses ?? []).map((e) => ({
      name: e.name,
      amount: e.amount,
    })),
  };
};

/** Bölmə kartı: yumşaq fon + başlıq + ikon + bir cümlə izah. */
function Section({
  icon: Icon,
  title,
  desc,
  tone = "muted",
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  tone?: "muted" | "plain";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-stone-200 p-4",
        tone === "muted" ? "bg-stone-50" : "bg-white",
      )}
    >
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
          <p className="text-xs text-stone-500">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** Qiymət/say sahəsi: label + input + kiçik izah + (opsional) əlavə sətir. */
function PriceField({
  label,
  hint,
  error,
  extra,
  children,
}: {
  label: string;
  hint: string;
  error?: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-stone-700">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : (
        <p className="mt-1 text-xs text-stone-500">{hint}</p>
      )}
      {extra}
    </div>
  );
}

export function ProductForm({ open, onClose, initial }: Props) {
  const toast = useToast();
  const defaultMinStock = useSettingsStore((s) => s.defaultMinStock);
  const createMut = useCreateProduct();
  const updateMut = useUpdateProduct();
  const suppliers = useSuppliers();

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
  }, [open, initial, reset, defaultMinStock]);

  // Canlı hesablama
  const w = watch();
  const qty = Number(w.quantity) || 0;
  const pp = Number(w.purchasePrice) || 0;
  const sp = Number(w.salePrice) || 0;
  const expenses = w.expenses ?? [];
  const realCost = calcRealCost(pp, qty, expenses);
  const perUnit = profitPerUnit(sp, realCost);
  const percent = profitPercent(sp, realCost);
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
      expenses: mergeExpenseLines(data.expenses),
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

  // Alt-da sabit canlı nəticə paneli + düymələr.
  const footer = (
    <>
      <div
        className={cn(
          "grid grid-cols-3 gap-2 px-5 py-3 text-white",
          loss ? "bg-red-950" : "bg-emerald-950",
        )}
      >
        <ResultCell label="Real maya" value={fmtMoney(realCost)} tone="neutral" />
        <ResultCell
          label="Qazanc"
          value={fmtMoney(perUnit)}
          tone={loss ? "loss" : "ok"}
        />
        <ResultCell
          label="Qazanc %"
          value={`${percent.toFixed(0)}%`}
          tone={loss ? "loss" : "ok"}
        />
        {loss && (
          <p className="col-span-3 flex items-center gap-1.5 pt-1 text-xs font-semibold text-red-300">
            <AlertTriangle size={13} /> Satış qiyməti real mayadan aşağıdır —
            ziyana satırsınız!
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <Button type="button" variant="ghost" onClick={onClose}>
          Ləğv et
        </Button>
        <Button
          type="submit"
          form="product-form"
          disabled={saving}
          icon={<Check size={16} />}
          className="h-[52px] flex-1 text-base"
        >
          {initial?.id ? "Yadda saxla" : "Malı əlavə et"}
        </Button>
      </div>
    </>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      footer={footer}
      title={initial?.id ? "Malı redaktə et" : "Yeni mal əlavə et"}
    >
      <form id="product-form" onSubmit={handleSubmit(onValid)} className="space-y-4">
        {/* ① Mal haqqında */}
        <Section
          icon={Package}
          title="Mal haqqında"
          desc="Malın adı, şəkli və əsas məlumatları"
        >
          <Field label="Mal adı" required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="Məs: Kişi cins şalvar"
              className="h-14 text-lg"
            />
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">
              Xüsusiyyətlər
            </label>
            {fields.length === 0 ? (
              <p className="mb-2 text-xs text-stone-400">
                Ölçü, rəng, marka kimi əlavə məlumatlar — istəyə bağlı
              </p>
            ) : (
              <div className="mb-2 space-y-2">
                {fields.map((f, idx) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <Input
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
        </Section>

        {/* ② Qiymət və say */}
        <Section
          icon={Coins}
          title="Qiymət və say"
          desc="Neçəyə aldın, neçəyə satırsan və neçə ədəd"
        >
          <div className="grid grid-cols-3 gap-3">
            <PriceField
              label="Alış"
              hint="aldığın qiymət"
              error={errors.purchasePrice?.message}
            >
              <Input type="number" min="0" step="0.01" {...register("purchasePrice")} />
            </PriceField>
            <PriceField
              label="Satış"
              hint="satacağın qiymət"
              error={errors.salePrice?.message}
              extra={
                perUnit > 0 && !errors.salePrice ? (
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">
                    +{fmtMoney(perUnit)} qazanc
                  </p>
                ) : null
              }
            >
              <Input type="number" min="0" step="0.01" {...register("salePrice")} />
            </PriceField>
            <PriceField
              label="Miqdar"
              hint="neçə ədəd"
              error={errors.quantity?.message}
            >
              <Input type="number" min="0" {...register("quantity")} />
            </PriceField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valyuta">
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select
                    name={field.name}
                    value={field.value}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    onChange={(e) => field.onChange(e.target.value)}
                  >
                    <option>AZN</option>
                    <option>USD</option>
                    <option>TRY</option>
                  </Select>
                )}
              />
            </Field>
            <Field label="Minimum stok" hint="bu saydan aşağı düşəndə xəbərdarlıq">
              <Input type="number" min="0" {...register("minStock")} />
            </Field>
          </div>
        </Section>

        {/* ③ Yer */}
        <Section
          icon={MapPin}
          title="Yer"
          desc="Təchizatçı və anbardakı yeri"
        >
          <Field label="Təchizatçı">
            <Controller
              name="supplierId"
              control={control}
              render={({ field }) => (
                <Select
                  name={field.name}
                  value={field.value}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  onChange={(e) => field.onChange(e.target.value)}
                >
                  <option value="">Seçin...</option>
                  {(suppliers.data ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
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
        </Section>

        {/* ④ Əlavə */}
        <Section
          icon={ClipboardList}
          title="Əlavə"
          desc="Qeyd və partiya xərcləri — istəyə bağlı"
        >
          <Field label="Qeyd">
            <Textarea {...register("note")} />
          </Field>

          <ExpenseRows
            key={initial?.id ?? "new"}
            value={w.expenses ?? []}
            onChange={(rows) =>
              setValue("expenses", rows, { shouldDirty: true })
            }
          />
        </Section>
      </form>
    </Drawer>
  );
}

/** Canlı nəticə paneli üçün tək rəqəm. */
function ResultCell({
  label,
  value,
  tone = "ok",
}: {
  label: string;
  value: string;
  tone?: "ok" | "loss" | "neutral";
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-white/60">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums whitespace-nowrap",
          tone === "loss"
            ? "text-red-300"
            : tone === "neutral"
              ? "text-white"
              : "text-emerald-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}
