import { z } from "zod";
import type { PaymentType } from "@/types";

/** GET /api/sales sorğu parametrləri. */
export interface SalesListParams {
  take?: number;
  skip?: number;
  /** ISO tarix (gün): createdAt >= from */
  from?: string;
  /** ISO tarix (gün): createdAt <= to */
  to?: string;
  paymentType?: PaymentType;
}

/**
 * Satış yaratma payload-u üçün Zod sxemi (bir mənbə, tip z.infer ilə çıxarılır).
 * Katalog satışı: productId dolu. Sərbəst (manual) satış: isManual=true,
 * productId=null, productName məcburi, costPerUnit bilinmirsə null.
 */
export const createSaleSchema = z
  .object({
    /** Katalog malı id-si; sərbəst satışda null. */
    productId: z.string().nullable(),
    /** Sərbəst satışda əl ilə yazılan mal adı. */
    productName: z.string().optional(),
    /** Kateqoriya; sərbəstdə istəyə bağlı, katalogda maldan göndərilə bilər. */
    category: z.string().nullable().optional(),
    quantity: z.coerce.number().int("Tam ədəd olmalıdır").min(1, "Say ən azı 1 olmalıdır"),
    salePrice: z.coerce.number().gt(0, "Qiymət mütləqdir"),
    discount: z.coerce.number().min(0, "Mənfi ola bilməz").default(0),
    paymentType: z.enum(["Nağd", "Kart", "Nisyə"]),
    customerId: z.string().nullable(),
    /** Sərbəst satışda maya; bilinmirsə null ("naməlum" qazanc). */
    costPerUnit: z.coerce.number().min(0, "Mənfi ola bilməz").nullable().optional(),
    /** Sərbəst (katalogdankənar) satış bayrağı. */
    isManual: z.boolean().optional(),
    note: z.string().optional(),
  })
  .refine((v) => v.paymentType !== "Nisyə" || !!v.customerId, {
    message: "Nisyə satış üçün müştəri seçilməlidir",
    path: ["customerId"],
  })
  .refine((v) => !v.isManual || (v.productName?.trim().length ?? 0) > 0, {
    message: "Sərbəst satış üçün mal adı mütləqdir",
    path: ["productName"],
  })
  .refine((v) => !!v.isManual || !!v.productId, {
    message: "Mal seçilməlidir",
    path: ["productId"],
  });

/** Yeni satış üçün giriş (mock və real POST /api/sales eyni payload). */
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
