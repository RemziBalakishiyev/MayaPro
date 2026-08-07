import { fmtMoney } from "@/lib/format";
import { REPORT_COLORS, type NamedValue, type ReportColorKey } from "../lib";
import { ChartDataTable } from "./ChartDataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";

/**
 * FE#78 (bənd #13) — ADdan `REPORT_COLORS` açarına, İNDEKSƏ DEYİL. Əvvəl
 * `PIE_COLORS[i]` istifadə olunurdu (sıra: Nağd/Kart/Nisyə) — bu, "Kart"a
 * səhvən narıncı, "Nisyə"yə səhvən göy rəng verirdi (semantik xəritə ilə
 * TƏRS). İndi ad üzrə axtarılır — sıra dəyişsə belə rəng düzgün qalır.
 */
const NAME_TO_COLOR: Record<string, ReportColorKey> = {
  Nağd: "cash",
  Kart: "card",
  Nisyə: "credit",
};

interface Props {
  data: NamedValue[];
}

/** Nağd/Kart/Nisyə müqayisəsi — progress barlar (faizlə). Hər sətir öz adı
 * və dəyəri ilə render olunduğu üçün ayrıca legend-ə ehtiyac yoxdur (FE#78
 * bənd #7 — mövcud sətirlər onsuz da görünən/oxunaqlı legend rolunu oynayır). */
export function PaymentBreakdown({ data }: Props) {
  const total = data.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    return (
      <EmptyState embedded icon={Wallet} title="Bu dövrdə ödəniş datası yoxdur" />
    );
  }
  return (
    <>
      <div className="space-y-3">
        {data.map((x) => {
          const pct = (x.value / total) * 100;
          const colorKey = NAME_TO_COLOR[x.name] ?? "sales";
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
                  style={{ width: `${pct}%`, background: REPORT_COLORS[colorKey] }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <ChartDataTable
        caption="Nağd/Kart/Nisyə müqayisəsi cədvəli"
        columns={[
          { key: "name", label: "Ödəniş növü" },
          { key: "value", label: "Məbləğ", numeric: true },
          { key: "pct", label: "Faiz", numeric: true },
        ]}
        rows={data.map((x) => ({
          name: x.name,
          value: fmtMoney(x.value),
          pct: `${((x.value / total) * 100).toFixed(0)}%`,
        }))}
      />
    </>
  );
}
