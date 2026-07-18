import { z } from "zod";

/** Partiya xərcləri — form daxili dinamik sətir (çıxışda breakdown-a yığılır). */
export const expenseRowSchema = z.object({
  kind: z.enum(["yol", "fehle", "yer", "paket", "diger"]),
  amount: z.coerce.number().min(0, "Mənfi ola bilməz").default(0),
});

/** Dinamik xüsusiyyət sətri (ad + dəyər). */
export const attributeSchema = z.object({
  name: z.string().default(""),
  value: z.string().default(""),
});

/** Mal formu üçün Zod sxemi (bir mənbə, tip z.infer ilə çıxarılır). */
export const productSchema = z.object({
  name: z.string().min(1, "Mal adı mütləqdir"),
  image: z.string().default(""),
  category: z.string().default(""),
  attributes: z
    .array(attributeSchema)
    .max(15, "Maksimum 15 xüsusiyyət")
    .default([]),
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
  expenseRows: z.array(expenseRowSchema).default([]),
});

/** Form dəyərlərinin tipi. */
export type ProductFormValues = z.infer<typeof productSchema>;
