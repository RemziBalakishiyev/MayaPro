import { z } from "zod";

/** Partiya xərci sətri — forma və API eyni forma. */
export const expenseRowSchema = z.object({
  name: z.string().default(""),
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
  expenses: z.array(expenseRowSchema).default([]),
});

/** Form dəyərlərinin tipi. */
export type ProductFormValues = z.infer<typeof productSchema>;

/**
 * Excel idxalı (BE#13) — backend kontraktı ilə sətir-sətir üst-üstə düşür.
 * `ImportRowStatus` kiçik hərflə string-lərdir (enum yox), sətir statusu üçün.
 */
export type ImportRowStatusValue = "create" | "update" | "error";

/** Uğurla parse olunmuş sətrin sahələri — `error` sətirlərində `data` `null`-dur. */
export interface ImportRowData {
  name: string;
  category: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minStock: number;
  warehouse: string;
  store: string;
  shelf: string;
  box: string;
  attributes: { name: string; value: string }[];
  note: string;
}

/** Önizləmə cavabının bir sətri. */
export interface ImportRowResult {
  rowNumber: number;
  status: ImportRowStatusValue;
  data: ImportRowData | null;
  error: string | null;
}

/** Sətir sayı təsnifatı + yeni yaradılacaq kateqoriyaların adları. */
export interface ImportSummary {
  creates: number;
  updates: number;
  errors: number;
  newCategories: string[];
}

/** `POST /api/imports/products/preview` cavabı. */
export interface ImportPreviewResponse {
  importToken: string;
  rows: ImportRowResult[];
  summary: ImportSummary;
}
