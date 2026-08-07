import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { REPORT_COLORS } from "../lib";
import { ChartDataTable } from "./ChartDataTable";

interface Props {
  data: Array<{ name: string; qty: number }>;
  height?: number;
}

export function TopProductsBar({ data, height = 300 }: Props) {
  if (data.length === 0) {
    return <EmptyState embedded icon={Package} title="Satış datası yoxdur" />;
  }
  return (
    <>
      {/* Senior-frontend review (bənd #12) — bax DailyBarChart-dəki eyni
          şərh: dekorativ SVG `aria-hidden`, ekvivalent `ChartDataTable`
          screen reader üçün əsas mənbədir. */}
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={120}
            />
            {/* FE#78 (bənd #9) — tooltip: mal adı (label) · satılan ədəd. */}
            <Tooltip formatter={(v) => `${v} əd.`} />
            <Bar dataKey="qty" name="Satılan ədəd" fill={REPORT_COLORS.sales} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Ən çox satılan mallar cədvəli"
        columns={[
          { key: "name", label: "Mal" },
          { key: "qty", label: "Satılan ədəd", numeric: true },
        ]}
        rows={data.map((d) => ({ name: d.name, qty: `${d.qty} əd.` }))}
      />
    </>
  );
}
