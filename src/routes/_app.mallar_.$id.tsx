import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Package,
  Pencil,
  Plus,
  Minus,
  Barcode,
  MapPin,
  Truck,
  StickyNote,
  ShoppingCart,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useProduct } from "@/features/products/queries";
import { useSales } from "@/features/sales/queries";
import { useSuppliers } from "@/features/suppliers/queries";
import { useCan } from "@/features/auth/store";
import {
  profitPerUnit,
  profitPercent,
  totalExpenses,
} from "@/features/products/lib";
import { ProductStatusBadge } from "@/features/products/components/ProductStatusBadge";
import { ProductForm } from "@/features/products/components/ProductForm";
import { StockAdjustModal } from "@/features/products/components/StockAdjustModal";
import type { StockMode } from "@/features/products/components/ProductsTable";

export const Route = createFileRoute("/_app/mallar_/$id")({
  component: ProductDetailPage,
});

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-stone-400">{label}</p>
        <p className="break-words text-sm font-semibold text-stone-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: allSales = [] } = useSales();
  const { data: suppliers = [] } = useSuppliers();
  const canWrite = useCan()("products.write");

  const [formOpen, setFormOpen] = useState(false);
  const [stockMode, setStockMode] = useState<StockMode | null>(null);

  const sales = useMemo(
    () =>
      product
        ? allSales
            .filter((s) => s.productId === product.id)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        : [],
    [allSales, product],
  );

  const soldCount = useMemo(
    () => sales.reduce((s, x) => s + x.quantity, 0),
    [sales],
  );
  const salesRevenue = useMemo(
    () => sales.reduce((s, x) => s + x.totalAmount, 0),
    [sales],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div>
        <Link to="/mallar">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={16} />}>
            Mallara qayıt
          </Button>
        </Link>
        <div className="mt-8">
          <EmptyState
            icon={Package}
            title="Mal tapılmadı"
            hint="Bu mal silinmiş və ya mövcud deyil."
          />
        </div>
      </div>
    );
  }

  const loss = product.salePrice < product.realCostPerUnit;
  const pct = profitPercent(product.salePrice, product.realCostPerUnit);
  const unitProfit = profitPerUnit(product.salePrice, product.realCostPerUnit);
  const stockValue = product.realCostPerUnit * product.quantity;
  const expTotal = totalExpenses(product.expenses);
  const supplier = suppliers.find((s) => s.id === product.supplierId);

  return (
    <div>
      {/* Üst sətir: qayıt + əməliyyatlar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/mallar">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />}>
            Mallara qayıt
          </Button>
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setStockMode("add")}
          >
            Stok artır
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Minus size={15} />}
            onClick={() => setStockMode("sub")}
          >
            Stok azalt
          </Button>
          {canWrite && (
            <Button
              size="sm"
              icon={<Pencil size={15} />}
              onClick={() => setFormOpen(true)}
            >
              Redaktə et
            </Button>
          )}
        </div>
      </div>

      {/* Başlıq: şəkil + ad + status */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 text-stone-300 ring-1 ring-stone-200">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={36} />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-stone-900 lg:text-3xl">
              {product.name}
            </h1>
            <ProductStatusBadge product={product} />
          </div>
          <p className="mt-1 text-base text-stone-500">
            {product.category || "Kateqoriyasız"}
          </p>
        </div>
      </div>

      {/* Əsas rəqəmlər */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Real maya" value={fmtMoney(product.realCostPerUnit)} />
        <StatCard
          label="Satış qiyməti"
          value={fmtMoney(product.salePrice)}
          tone={loss ? "red" : "default"}
          sub={`1 ədəd qazanc: ${fmtMoney(unitProfit)}`}
        />
        <StatCard
          label="Qazanc %"
          value={`${pct.toFixed(1)} %`}
          tone={pct < 0 ? "red" : "green"}
        />
        <StatCard
          label="Stok"
          value={`${product.quantity} əd.`}
          tone={
            product.quantity === 0
              ? "red"
              : product.quantity <= product.minStock
                ? "amber"
                : "default"
          }
          sub={`Anbar dəyəri: ${fmtMoney(stockValue)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol: məlumatlar */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Ümumi məlumat">
            <div className="grid grid-cols-1 divide-y divide-stone-100 sm:grid-cols-2 sm:gap-x-8 sm:divide-y-0">
              <InfoRow
                icon={Barcode}
                label="Barkod"
                value={product.barcode}
              />
              <InfoRow
                icon={Truck}
                label="Təchizatçı"
                value={supplier?.name}
              />
              <InfoRow
                icon={MapPin}
                label="Anbar yeri"
                value={product.location}
              />
              <InfoRow
                icon={Package}
                label="Minimum stok"
                value={`${product.minStock} əd.`}
              />
              <InfoRow
                icon={Calendar}
                label="Əlavə olunma"
                value={fmtDate(product.createdAt)}
              />
              <InfoRow
                icon={Calendar}
                label="Son yenilənmə"
                value={fmtDate(product.updatedAt)}
              />
            </div>
          </Card>

          {/* Dinamik xüsusiyyətlər */}
          {product.attributes.length > 0 && (
            <Card title="Xüsusiyyətlər">
              <div className="flex flex-wrap gap-2">
                {product.attributes.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2"
                  >
                    <p className="text-[11px] font-medium text-stone-400">
                      {a.name || "—"}
                    </p>
                    <p className="text-sm font-semibold text-stone-800">
                      {a.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Qeyd */}
          {product.note && (
            <Card title="Qeyd">
              <p className="flex items-start gap-2 text-sm text-stone-700">
                <StickyNote size={16} className="mt-0.5 shrink-0 text-stone-400" />
                <span className="whitespace-pre-wrap">{product.note}</span>
              </p>
            </Card>
          )}

          {/* Satış tarixçəsi */}
          <Card
            title="Satış tarixçəsi"
            action={
              <span className="text-sm text-stone-500">
                {soldCount} əd. · {fmtMoney(salesRevenue)}
              </span>
            }
          >
            {sales.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="Hələ satış yoxdur"
                hint="Bu mal satılan kimi burada görünəcək."
              />
            ) : (
              <div className="divide-y divide-stone-100">
                {sales.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800">
                        {s.quantity} əd. × {fmtMoney(s.salePrice)}
                        {s.discount > 0 && (
                          <span className="ml-1 text-xs text-amber-600">
                            (−{fmtMoney(s.discount)} endirim)
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {fmtDate(s.createdAt)} · {s.paymentType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums text-stone-900">
                        {fmtMoney(s.totalAmount)}
                      </p>
                      {s.profit == null ? (
                        <p className="text-[11px] font-semibold tabular-nums text-stone-400">
                          —
                        </p>
                      ) : (
                        <p
                          className={`text-[11px] font-semibold tabular-nums ${
                            s.profit < 0 ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {s.profit < 0 ? "" : "+"}
                          {fmtMoney(s.profit)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sağ: qiymət və maya bölgüsü */}
        <div className="space-y-6">
          <Card title="Qiymət bölgüsü">
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Alış qiyməti</dt>
                <dd className="font-semibold tabular-nums text-stone-800">
                  {fmtMoney(product.purchasePrice)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Partiya xərcləri</dt>
                <dd className="font-semibold tabular-nums text-stone-800">
                  {fmtMoney(expTotal)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2.5">
                <dt className="font-semibold text-stone-700">Real maya (1 əd.)</dt>
                <dd className="font-bold tabular-nums text-stone-900">
                  {fmtMoney(product.realCostPerUnit)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Satış qiyməti</dt>
                <dd className="font-semibold tabular-nums text-stone-800">
                  {fmtMoney(product.salePrice)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-stone-100 pt-2.5">
                <dt className="font-semibold text-stone-700">1 ədəd qazanc</dt>
                <dd
                  className={`font-bold tabular-nums ${
                    unitProfit < 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {fmtMoney(unitProfit)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Partiya xərcləri">
            {expTotal === 0 ? (
              <p className="text-sm text-stone-400">Partiya xərci qeyd olunmayıb.</p>
            ) : (
              <dl className="space-y-2.5 text-sm">
                {(product.expenses ?? []).map((e, i) => (
                  <div key={`${e.name}-${i}`} className="flex justify-between gap-3">
                    <dt className="min-w-0 truncate text-stone-500">{e.name}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums text-stone-800">
                      {fmtMoney(e.amount)}
                    </dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-stone-100 pt-2.5">
                  <dt className="font-semibold text-stone-700">Cəmi</dt>
                  <dd className="font-bold tabular-nums text-stone-900">
                    {fmtMoney(expTotal)}
                  </dd>
                </div>
              </dl>
            )}
          </Card>
        </div>
      </div>

      <ProductForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={product}
      />
      <StockAdjustModal
        open={stockMode !== null}
        onClose={() => setStockMode(null)}
        product={product}
        mode={stockMode ?? "add"}
      />
    </div>
  );
}
