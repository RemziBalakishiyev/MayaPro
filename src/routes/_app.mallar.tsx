import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Upload, Download, Printer } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { productStatus } from "@/features/products/lib";
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

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockModal, setStockModal] = useState<{
    product: Product;
    mode: StockMode;
  } | null>(null);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].filter(Boolean),
    [products],
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
        !`${p.name} ${p.category} ${p.model} ${p.color}`
          .toLowerCase()
          .includes(q)
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

  const uiOnly = () => toast.info("Bu funksiya backend ilə əlavə olunacaq");

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
              icon={<Download size={14} />}
              onClick={uiOnly}
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
            <Button size="sm" icon={<Plus size={14} />} onClick={openNew}>
              Yeni mal
            </Button>
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
        onEdit={(p) => {
          setEditing(p);
          setFormOpen(true);
        }}
        onAdjust={(product, mode) => setStockModal({ product, mode })}
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
    </div>
  );
}
