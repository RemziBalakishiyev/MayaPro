import { useMemo } from "react";
import { ArrowDownLeft, BookOpen, HandCoins, Package, Plus } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useProducts } from "@/features/products/queries";
import { useSupplierHistory } from "../queries";
import type { Supplier, SupplierHistoryEntry } from "@/types";

interface Props {
  supplier: Supplier | null;
  onClose: () => void;
  onAddDebt: (supplier: Supplier) => void;
  onPay: (supplier: Supplier) => void;
}

function historyLabel(entry: SupplierHistoryEntry): string {
  return entry.type === "initialDebt" ? "İlkin borc" : "Ödəniş";
}

export function SupplierDrawer({ supplier, onClose, onAddDebt, onPay }: Props) {
  const { data: allProducts = [] } = useProducts();
  const { data: historyAsc = [] } = useSupplierHistory(supplier?.id);

  const supProducts = useMemo(
    () =>
      supplier
        ? allProducts.filter((p) => p.supplierId === supplier.id)
        : [],
    [allProducts, supplier],
  );

  // UI: ən yenilər yuxarıda
  const history = useMemo(
    () => [...historyAsc].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [historyAsc],
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
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Borc / ödəniş tarixçəsi
              </h4>
              {history.length > 0 && (
                <span className="text-xs tabular-nums text-stone-400">
                  {history.length} əməliyyat
                </span>
              )}
            </div>
            {history.length === 0 ? (
              <EmptyState icon={HandCoins} title="Tarixçə yoxdur" />
            ) : (
              <ul className="relative space-y-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {history.map((h, i) => {
                  const isPay = h.type === "payment";
                  return (
                    <li
                      key={`${h.type}-${h.date}-${h.amount}-${i}`}
                      className={cn(
                        "relative flex items-center gap-3 px-3.5 py-3",
                        i > 0 && "border-t border-stone-100",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isPay
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600",
                        )}
                      >
                        {isPay ? (
                          <ArrowDownLeft size={15} />
                        ) : (
                          <BookOpen size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="min-w-0 truncate text-sm font-semibold text-stone-800">
                          {historyLabel(h)}
                        </p>
                        <p className="text-xs text-stone-400">
                          {fmtDate(h.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          isPay ? "text-emerald-700" : "text-red-600",
                        )}
                      >
                        {isPay ? "−" : "+"}
                        {fmtMoney(h.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
