import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import { REPORT_COLORS, nonZeroCount, MIN_CHART_POINTS } from "../lib";
import { ChartDataTable } from "./ChartDataTable";

interface Props {
  data: object[];
  xKey: string;
  dataKey?: string;
  stroke?: string;
  height?: number;
  /**
   * FE#78 (bənd #6/#8) — "28.07 – 03.08" kimi geniş etiketlər üçün (dövr
   * kimi qısa "01.26" DEYİL) X ox etiketlərini bir qədər kiçildir və hamısını
   * göstərir (`interval={0}`). Aylıq trend (Dashboard) üçün DƏYİŞMƏYİB.
   */
  wideLabels?: boolean;
}

/** FE#78 (bənd #9) — tooltip: etiket (tarix/aralıq) · dəyər `fmtMoney` formatında. */
function TrendTooltip({
  active,
  payload,
  label,
  seriesLabel,
}: TooltipProps<number, string> & { seriesLabel: string }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  return (
    <div className="rounded-control border border-stone-200 bg-white px-3 py-2 text-xs shadow-overlay">
      <p className="mb-1 font-semibold text-stone-700">{label}</p>
      <p className="text-stone-600">
        {seriesLabel}:{" "}
        <span className="font-semibold text-stone-800">
          {fmtMoney(Number(value))}
        </span>
      </p>
    </div>
  );
}

export function TrendLineChart({
  data,
  xKey,
  dataKey = "qazanc",
  stroke = REPORT_COLORS.profit,
  height = 300,
  wideLabels = false,
}: Props) {
  // FE#78 (bənd #11) — seyrək data həddi (2-dən az qeyri-sıfır nöqtə).
  const pick = (d: object) => Number((d as Record<string, unknown>)[dataKey]);
  const sparse = nonZeroCount(data, pick) < MIN_CHART_POINTS;
  if (sparse) {
    return (
      <EmptyState
        embedded
        icon={TrendingUp}
        title="Bu dövrdə kifayət qədər məlumat yoxdur"
      />
    );
  }

  const seriesLabel = dataKey === "qazanc" ? "Qazanc" : dataKey;

  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, left: 0, bottom: wideLabels ? 16 : 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: wideLabels ? 11 : 12 }}
            interval={wideLabels ? 0 : undefined}
            tickMargin={8}
          />
          <YAxis tick={{ fontSize: 12 }} width={56} />
          <Tooltip content={<TrendTooltip seriesLabel={seriesLabel} />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name={seriesLabel}
            stroke={stroke}
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartDataTable
        caption={`${seriesLabel} trendi cədvəli`}
        columns={[
          { key: "x", label: "Dövr" },
          { key: "value", label: seriesLabel, numeric: true },
        ]}
        rows={data.map((d) => ({
          x: String((d as Record<string, unknown>)[xKey]),
          value: fmtMoney(pick(d)),
        }))}
      />
    </>
  );
}
