import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  productsApi,
  productImportsApi,
  type NewProduct,
  type ProductUpdate,
} from "./api";

/** Query key-lər — bir mənbədə. */
export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => ["products", id] as const,
};

export const useProducts = () =>
  useQuery({
    queryKey: productKeys.all,
    queryFn: productsApi.list,
  });

export const useProduct = (id: string | undefined) =>
  useQuery({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: () => productsApi.get(id as string),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NewProduct) => productsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdate }) =>
      productsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useAdjustStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      delta,
      reason,
    }: {
      id: string;
      delta: number;
      reason?: string;
    }) => productsApi.adjustStock(id, delta, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: ["activity"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useGenerateBarcode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.generateBarcode(id),
    // onSettled: 409 (barkod artıq mövcuddur — başqa istifadəçi yaradıb)
    // halında da siyahı təzələnsin ki, sətirdə aktual barkod görünsün.
    onSettled: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};

/**
 * Excel idxalı — Addım 1: fayl seçilən kimi avtomatik çağırılır, DB-yə heç
 * nə yazmır (yalnız təsnifat + `importToken`), ona görə invalidate yoxdur.
 */
export const usePreviewProductsImport = () =>
  useMutation({
    mutationFn: (file: File) => productImportsApi.preview(file),
  });

/**
 * Excel idxalı — Addım 2-dəki "N sətri idxal et" düyməsi (nəticə Addım 3-də
 * göstərilir). Uğurlu commit DB-ni dəyişir, ona görə mallar, kateqoriyalar,
 * dashboard və fəaliyyət jurnalı invalidasiya olunur.
 *
 * Modal bağlansa belə invalidasiya işləyir: `ExcelImportModal` "Mallar"
 * səhifəsində daim mount olunmuş qalır (yalnız `open` prop-u dəyişir), yəni
 * sorğu davam edərkən modalı bağlamaq `onSuccess`-i ləğv etmir. Yeganə istisna
 * — commit gedərkən səhifədən tam çıxmaq; o halda query-lər onsuz da unmount
 * olunur və 30 saniyəlik `staleTime`-dan sonra qayıdışda yenidən çəkilir.
 */
export const useCommitProductsImport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (importToken: string) => productImportsApi.commit(importToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.all });
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    },
  });
};
