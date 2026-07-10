import { z } from "zod";

/** Partiya xərcləri — form sahələri (boş sətir 0-a çevrilir). */
const money = z.coerce.number().min(0, "Mənfi ola bilməz").default(0);

export const expensesSchema = z.object({
  yol: money,
  fehle: money,
  yer: money,
  paket: money,
  diger: money,
});

/** Mal formu üçün Zod sxemi (bir mənbə, tip z.infer ilə çıxarılır). */
export const productSchema = z.object({
  name: z.string().min(1, "Mal adı mütləqdir"),
  image: z.string().default(""),
  category: z.string().default(""),
  model: z.string().default(""),
  size: z.string().default(""),
  color: z.string().default(""),
  barcode: z.string().default(""),
  purchasePrice: z.coerce.number().gt(0, "Alış qiyməti mütləqdir"),
  salePrice: z.coerce.number().gt(0, "Satış qiyməti mütləqdir"),
  quantity: z.coerce.number().int("Tam ədəd olmalıdır").gt(0, "Miqdar mütləqdir"),
  minStock: z.coerce.number().min(0).default(0),
  currency: z.string().default("AZN"),
  supplierId: z.string().default(""),
  store: z.string().default(""),
  warehouse: z.string().default(""),
  shelf: z.string().default(""),
  box: z.string().default(""),
  note: z.string().default(""),
  expenses: expensesSchema,
});

/** Form dəyərlərinin tipi. */
export type ProductFormValues = z.infer<typeof productSchema>;
