import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import { PIE_COLORS, type NamedValue } from "../lib";
import { ChartDataTable } from "./ChartDataTable";

interface Props {
  data: NamedValue[];
  height?: number;
}

export function ExpensePie({ data, height = 300 }: Props) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) {
    return <EmptyState embedded icon={Receipt} title="Xərc datası yoxdur" />;
  }
  const total = nonZero.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <>
      {/* Senior-frontend review (bənd #12) — bax DailyBarChart-dəki eyni
          şərh: dekorativ SVG `aria-hidden`, ekvivalent `ChartDataTable`
          screen reader üçün əsas mənbədir. */}
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={nonZero}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(e) => e.name}
            >
              {nonZero.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            {/* FE#78 (bənd #9) — tooltip: kateqoriya · məbləğ fmtMoney formatında. */}
            <Tooltip formatter={(v) => fmtMoney(Number(v))} />
            {/* FE#78 (bənd #7) — legend həmişə görünür (bir neçə kiçik dilimin
                etiketi pie üzərində üst-üstə düşəndə oxunmaz olur). */}
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ChartDataTable
        caption="Xərc kateqoriyaları cədvəli"
        columns={[
          { key: "name", label: "Kateqoriya" },
          { key: "value", label: "Məbləğ", numeric: true },
          { key: "pct", label: "Faiz", numeric: true },
        ]}
        rows={nonZero.map((d) => ({
          name: d.name,
          value: fmtMoney(d.value),
          pct: `${((d.value / total) * 100).toFixed(0)}%`,
        }))}
      />
    </>
  );
}
