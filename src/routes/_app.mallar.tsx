import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Upload, Download, Printer, Loader2 } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { USE_MOCK } from "@/lib/api-client";
import { downloadFile } from "@/lib/download";
import { fmtMoney } from "@/lib/format";
import { useProducts, useDeleteProduct } from "@/features/products/queries";
import { useCategories } from "@/features/categories/queries";
import { useCan } from "@/features/auth/store";
import { productStatus, attrText } from "@/features/products/lib";
import {
  ProductFilters,
  type ProductFilterValues,
} from "@/features/products/components/ProductFilters";
import {
  ProductsTable,
  type StockMode,
} from "@/features/products/components/ProductsTable";
import { ProductForm } from "@/features/products/components/ProductForm";
import { StockAdjustModal } from "@/features/products/components/StockAdjustModal";
import type { Product } from "@/types";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  status: z
    .enum(["Stokda var", "Azalır", "Bitib", "Satılmır", "Ziyana satılır"])
    .optional(),
  loc: z.string().optional(),
});

export const Route = createFileRoute("/_app/mallar")({
  validateSearch: searchSchema,
  component: MallarPage,
});

function MallarPage() {
  const toast = useToast();
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data: products = [], isLoading } = useProducts();
  const { data: categoryList = [] } = useCategories();
  const canWrite = useCan()("products.write");
  const deleteMut = useDeleteProduct();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteFor, setDeleteFor] = useState<Product | null>(null);
  const [exporting, setExporting] = useState(false);
  const [stockModal, setStockModal] = useState<{
    product: Product;
    mode: StockMode;
  } | null>(null);

  // Kateqoriyalar backend siyahısından; malda olan, lakin siyahıda olmayan
  // köhnə kateqoriyalar da filtrdə görünsün deyə birləşdirilir.
  const categories = useMemo(
    () =>
      [
        ...new Set([
          ...categoryList.map((c) => c.name),
          ...products.map((p) => p.category),
        ]),
      ].filter(Boolean),
    [categoryList, products],
  );
  const locations = useMemo(
    () =>
      [
        ...new Set(products.map((p) => (p.location || "").split(" / ")[0])),
      ].filter(Boolean),
    [products],
  );

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase();
    return products.filter((p) => {
      if (
        q &&
        !`${p.name} ${p.category} ${attrText(p)}`.toLowerCase().includes(q)
      )
        return false;
      if (search.cat && p.category !== search.cat) return false;
      if (search.status && productStatus(p) !== search.status) return false;
      if (search.loc && !(p.location || "").startsWith(search.loc)) return false;
      return true;
    });
  }, [products, search]);

  const stockValue = useMemo(
    () => products.reduce((s, p) => s + p.realCostPerUnit * p.quantity, 0),
    [products],
  );

  const updateFilter = (patch: ProductFilterValues) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Mal silindi");
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mal silinmədi");
    }
  };

  const uiOnly = () => toast.info("Bu funksiya backend ilə əlavə olunacaq");

  const exportExcel = async () => {
    if (USE_MOCK) {
      toast.info("Export real backend rejimində işləyir");
      return;
    }
    setExporting(true);
    try {
      await downloadFile("/api/exports/products.xlsx", "products.xlsx");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Excel endirilmədi");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHead
        title="Mallar / Anbar"
        subtitle={`${products.length} mal · Anbar dəyəri: ${fmtMoney(stockValue)}`}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={14} />}
              onClick={uiOnly}
            >
              Excel import
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={
                exporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )
              }
              onClick={() => void exportExcel()}
              disabled={exporting}
            >
              Excel export
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={uiOnly}
            >
              Barkod/QR çap
            </Button>
            {canWrite && (
              <Button size="md" icon={<Plus size={18} />} onClick={openNew}>
                Yeni mal
              </Button>
            )}
          </>
        }
      />

      <ProductFilters
        value={search}
        categories={categories}
        locations={locations}
        onChange={updateFilter}
      />

      <ProductsTable
        products={filtered}
        isLoading={isLoading}
        canEdit={canWrite}
        onEdit={(p) => {
          setEditing(p);
          setFormOpen(true);
        }}
        onAdjust={(product, mode) => setStockModal({ product, mode })}
        onDelete={setDeleteFor}
      />

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
      />
      <StockAdjustModal
        open={!!stockModal}
        onClose={() => setStockModal(null)}
        product={stockModal?.product ?? null}
        mode={stockModal?.mode ?? "add"}
      />
      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Malı sil"
        message={
          deleteFor && deleteFor.quantity > 0
            ? `Bu malın anbarda ${deleteFor.quantity} ədədi var! Satış tarixi qorunacaq, mal siyahıdan silinəcək`
            : "Satış tarixi qorunacaq, mal siyahıdan silinəcək"
        }
        confirmText="Sil"
        danger
      />
    </div>
  );
}
