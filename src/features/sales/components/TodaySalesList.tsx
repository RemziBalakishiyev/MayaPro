import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import type { Sale } from "@/types";

interface Props {
  sales: Sale[];
}

/** Bugünkü satışlar siyahısı. */
export function TodaySalesList({ sales }: Props) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Bu gün hələ satış yoxdur"
        hint="İlk satışı formdan edin."
      />
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {sales.map((s) => (
        <div
          key={s.id}
          className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">
            {s.productName} × {s.quantity}
          </span>
          <Badge tone={s.paymentType}>{s.paymentType}</Badge>
          <span className="w-24 text-right text-sm font-bold tabular-nums">
            {fmtMoney(s.totalAmount - s.discount)}
          </span>
          <span
            className={`w-24 text-right text-xs font-semibold tabular-nums ${
              s.profit < 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {s.profit >= 0 ? "+" : ""}
            {fmtMoney(s.profit)}
          </span>
        </div>
      ))}
    </div>
  );
}
