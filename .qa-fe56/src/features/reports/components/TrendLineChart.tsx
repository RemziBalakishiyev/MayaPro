import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";

interface Props {
  data: object[];
  xKey: string;
  dataKey?: string;
  stroke?: string;
  height?: number;
}

export function TrendLineChart({
  data,
  xKey,
  dataKey = "qazanc",
  stroke = "#047857",
  height = 300,
}: Props) {
  const empty = data.every(
    (d) => Number((d as Record<string, unknown>)[dataKey]) === 0,
  );
  if (empty) {
    return <EmptyState icon={TrendingUp} title="Qazanc datası yoxdur" />;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => fmtMoney(Number(v))} />
        <Line
          type="monotone"
          dataKey={dataKey}
          name="Qazanc"
          stroke={stroke}
          strokeWidth={2.5}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
