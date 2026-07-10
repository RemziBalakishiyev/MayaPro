import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import { lineTotal, netTotal, saleProfit, isLossSale } from "../lib";

interface Props {
  hasProduct: boolean;
  realCost: number;
  qty: number;
  salePrice: number;
  discount: number;
}

function LiveRow({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-500"}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          bold ? "text-lg font-bold" : "text-sm font-semibold"
        } ${tone ?? "text-stone-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

/** Canlı satış hesablaması paneli. */
export function SaleCalculator({
  hasProduct,
  realCost,
  qty,
  salePrice,
  discount,
}: Props) {
  const gross = lineTotal(salePrice, qty);
  const net = netTotal(salePrice, qty, discount);
  const profit = saleProfit(salePrice, qty, discount, realCost);
  const belowCost = isLossSale(salePrice, realCost);
  const minPrice = realCost;

  return (
    <div className="sticky top-16 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="mb-2 text-sm font-bold text-stone-800">Canlı hesablama</h3>
      {!hasProduct ? (
        <EmptyState
          icon={ShoppingCart}
          title="Mal seçin"
          hint="Hesablamalar burada görünəcək."
        />
      ) : (
        <>
          <LiveRow label="Real maya (1 əd.)" value={fmtMoney(realCost)} />
          <LiveRow label={`Satış məbləği (${qty} əd.)`} value={fmtMoney(gross)} />
          <LiveRow
            label="Endirim"
            value={`− ${fmtMoney(discount)}`}
            tone="text-amber-600"
          />
          <div className="my-1 border-t border-stone-100" />
          <LiveRow label="Xalis satış" value={fmtMoney(net)} bold />
          <LiveRow
            label="Qazanc"
            value={`${profit >= 0 ? "+" : ""}${fmtMoney(profit)}`}
            bold
            tone={profit < 0 ? "text-red-600" : "text-emerald-700"}
          />
          <LiveRow
            label="Minimum satış qiyməti"
            value={fmtMoney(minPrice)}
            tone="text-stone-500"
          />
          {belowCost && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
              Bu qiymətə satsan ziyana düşürsən. Minimum qiymət:{" "}
              {fmtMoney(minPrice)}
            </div>
          )}
          {!belowCost && net > 0 && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              Bu satış qazanclıdır.
            </div>
          )}
        </>
      )}
    </div>
  );
}
