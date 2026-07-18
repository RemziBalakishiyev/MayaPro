import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtDate, fmtMoney } from "@/lib/format";
import type { Sale } from "@/types";

interface Props {
  sales: Sale[];
  /** Yığcam boş vəziyyət (sağ panel xülasəsi). */
  compact?: boolean;
}

/** Vaxt etiketi — yalnız tam ISO datetime olduqda (tarix-only seed üçün boş). */
const saleTime = (iso: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  return fmtDate(iso, "HH:mm");
};

/** Bugünkü satışlar siyahısı — 2 sətirli kompakt kart. */
export function TodaySalesList({ sales, compact }: Props) {
  if (sales.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title={compact ? "Hələ satış yoxdur" : "Bu gün hələ satış yoxdur"}
        hint={compact ? undefined : "İlk satışı formdan edin."}
      />
    );
  }

  return (
    <div className="divide-y divide-stone-100">
      {sales.map((s) => {
        const time = saleTime(s.createdAt);
        return (
          <div key={s.id} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-baseline gap-2">
              <p className="min-w-0 basis-[60%] flex-1 truncate text-sm font-bold text-stone-900">
                {s.productName}
                {s.category ? (
                  <span className="ml-1.5 font-normal text-stone-400">
                    {s.category}
                  </span>
                ) : null}
              </p>
              <span className="shrink-0 text-sm font-bold tabular-nums text-stone-900">
                {fmtMoney(s.totalAmount)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-xs tabular-nums text-stone-400">
                {s.quantity} × {fmtMoney(s.salePrice)}
              </span>
              <Badge
                tone={s.paymentType}
                className="px-1.5 py-0.5 text-[11px]"
              >
                {s.paymentType}
              </Badge>
              {s.profit == null ? (
                <span className="text-xs font-semibold tabular-nums text-stone-400">
                  —
                </span>
              ) : (
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    s.profit < 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {s.profit >= 0 ? "+" : ""}
                  {fmtMoney(s.profit)}
                </span>
              )}
              {s.isManual && (
                <Badge tone="Sərbəst" className="px-1.5 py-0.5 text-[11px]">
                  Sərbəst
                </Badge>
              )}
              {time && (
                <span className="ml-auto text-[11px] tabular-nums text-stone-400">
                  {time}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
