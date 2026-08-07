import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { REPORT_COLORS, nonZeroCount, MIN_CHART_POINTS } from "../lib";
import type { DailyPoint } from "../lib";
import { ChartDataTable } from "./ChartDataTable";

interface Props {
  data: DailyPoint[];
  /** Qazanc seriyasını da göstər (Hesabatlar üçün) */
  showProfit?: boolean;
  height?: number;
}

/**
 * FE#78 (bənd #9) — hover/focus-da tarix (tam, il daxil) · satış · qazanc ·
 * xərc (mövcud olduqda) `fmtMoney` formatında. Yalnız TƏQDİMAT — dəyərlər
 * `payload`-dan olduğu kimi oxunur, heç bir yeni hesablama YOXDUR. `xerc`
 * çərtdə (`Bar`) göstərilmir (əvvəlki 2 seriyalı dizayn saxlanılır) — sadəcə
 * artıq `DailyPoint`-də mövcud olan dəyər tooltip-də əlavə sətir kimi
 * göstərilir, `point.xerc === undefined` olduqda (Dashboard-un köhnə
 * çağırışı) sətir sadəcə göstərilmir.
 */
function DailyTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DailyPoint | undefined;
  if (!point) return null;
  return (
    <div className="rounded-control border border-stone-200 bg-white px-3 py-2 text-xs shadow-overlay">
      <p className="mb-1 font-semibold text-stone-700">
        {fmtDate(point.fullDateIso)}
      </p>
      <p className="text-stone-600">
        Satış: <span className="font-semibold text-stone-800">{fmtMoney(point.satis)}</span>
      </p>
      {payload.some((p) => p.dataKey === "qazanc") && (
        <p className="text-stone-600">
          Qazanc: <span className="font-semibold text-stone-800">{fmtMoney(point.qazanc)}</span>
        </p>
      )}
      {point.xerc !== undefined && (
        <p className="text-stone-600">
          Xərc: <span className="font-semibold text-stone-800">{fmtMoney(point.xerc)}</span>
        </p>
      )}
    </div>
  );
}

export function DailyBarChart({ data, showProfit, height = 300 }: Props) {
  // FE#78 (bənd #9) — `xerc` yalnız çağıran tərəf `expenses` ötürdükdə
  // mövcuddur (bax `dailySeries`) — Dashboard-un köhnə çağırışı bunu
  // ötürmür, bu halda sütun/sətir sadəcə göstərilmir (geriyə uyğun).
  const hasExpense = data.some((d) => d.xerc !== undefined);
  // FE#78 (bənd #11) — seyrək data: böyük, əksər hissəsi boş qrafik ƏVƏZİNƏ
  // aydın mesaj. Hədd: 2-dən az qeyri-sıfır nöqtə (satış VƏ ya qazanc).
  const sparse =
    nonZeroCount(data, (d) => d.satis) < MIN_CHART_POINTS &&
    nonZeroCount(data, (d) => d.qazanc) < MIN_CHART_POINTS;

  if (sparse) {
    return (
      <EmptyState
        embedded
        icon={BarChart3}
        title="Bu dövrdə kifayət qədər məlumat yoxdur"
      />
    );
  }

  return (
    <>
      {/* Senior-frontend review (bənd #12) — chart SVG-si `aria-hidden`
          işarələnir: ekran oxuyucusu üçün DƏQİQ ekvivalent (aşağıdaki
          `ChartDataTable`) onsuz da mövcuddur, dekorativ SVG-nin qismən
          oxunması qarışıqlıq yaradır. */}
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={8} />
            <YAxis tick={{ fontSize: 12 }} width={56} />
            <Tooltip content={<DailyTooltip />} />
            {showProfit && <Legend wrapperStyle={{ fontSize: 12 }} />}
            <Bar dataKey="satis" name="Satış" fill={REPORT_COLORS.sales} radius={[4, 4, 0, 0]} />
            {showProfit && (
              <Bar dataKey="qazanc" name="Qazanc" fill={REPORT_COLORS.profit} radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Günlük satış və qazanc cədvəli"
        columns={[
          { key: "date", label: "Tarix" },
          { key: "satis", label: "Satış", numeric: true },
          ...(showProfit ? [{ key: "qazanc", label: "Qazanc", numeric: true }] : []),
          ...(hasExpense ? [{ key: "xerc", label: "Xərc", numeric: true }] : []),
        ]}
        rows={data.map((d) => ({
          date: fmtDate(d.fullDateIso),
          satis: fmtMoney(d.satis),
          qazanc: fmtMoney(d.qazanc),
          xerc: d.xerc !== undefined ? fmtMoney(d.xerc) : "—",
        }))}
      />
    </>
  );
}
