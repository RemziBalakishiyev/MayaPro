import { fmtMoney } from "@/lib/format";
import { PIE_COLORS, type NamedValue } from "../lib";

interface Props {
  data: NamedValue[];
}

/** Nağd/Kart/Nisyə müqayisəsi — progress barlar (faizlə). */
export function PaymentBreakdown({ data }: Props) {
  const total = data.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="space-y-3">
      {data.map((x, i) => {
        const pct = (x.value / total) * 100;
        return (
          <div key={x.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-stone-700">{x.name}</span>
              <span className="font-bold tabular-nums">
                {fmtMoney(x.value)}{" "}
                <span className="text-xs font-normal text-stone-400">
                  ({pct.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: PIE_COLORS[i] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
