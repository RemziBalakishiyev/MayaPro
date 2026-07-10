import { useMemo } from "react";
import { HandCoins, Package, Plus } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { useSupplierPayments } from "../queries";
import type { Supplier } from "@/types";

interface Props {
  supplier: Supplier | null;
  onClose: () => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
}

export function SupplierDrawer({ supplier, onClose, onAddDebt, onPay }: Props) {
  const { data: allProducts = [] } = useProducts();
  const { data: payments = [] } = useSupplierPayments(supplier?.id);

  const supProducts = useMemo(
    () =>
      supplier
        ? allProducts.filter((p) => p.supplierId === supplier.id)
        : [],
    [allProducts, supplier],
  );

  const sortedPays = useMemo(
    () => [...payments].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [payments],
  );

  return (
    <Drawer open={!!supplier} onClose={onClose} title={supplier?.name ?? ""}>
      {supplier && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Toplam borc" value={fmtMoney(supplier.totalDebt)} />
            <StatCard
              label="Ödənilən"
              value={fmtMoney(supplier.paidAmount)}
              tone="green"
            />
            <StatCard
              label="Qalıq"
              value={fmtMoney(supplier.remainingDebt)}
              tone={supplier.remainingDebt > 0 ? "red" : "green"}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="warn"
              icon={<Plus size={14} />}
              onClick={() => onAddDebt(supplier)}
            >
              Borc əlavə et
            </Button>
            <Button
              size="sm"
              icon={<HandCoins size={14} />}
              onClick={() => onPay(supplier)}
            >
              Ödəniş et
            </Button>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Bu təchizatçıdan alınan mallar
            </h4>
            {supProducts.length === 0 ? (
              <EmptyState icon={Package} title="Mal yoxdur" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {supProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
                      {p.name}
                    </span>
                    <span className="text-xs text-stone-400">
                      {p.quantity} əd. stokda
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Ödəniş tarixçəsi
            </h4>
            {sortedPays.length === 0 ? (
              <EmptyState icon={HandCoins} title="Ödəniş yoxdur" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {sortedPays.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2">
                    <span className="flex-1 text-sm text-stone-600">
                      {fmtDate(p.date)}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-emerald-700">
                      −{fmtMoney(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
