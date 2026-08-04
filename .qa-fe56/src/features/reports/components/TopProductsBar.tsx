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

interface Props {
  data: Array<{ name: string; qty: number }>;
  height?: number;
}

export function TopProductsBar({ data, height = 300 }: Props) {
  if (data.length === 0) {
    return <EmptyState icon={Package} title="Satış datası yoxdur" />;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10 }}
          width={120}
        />
        <Tooltip formatter={(v) => `${v} əd.`} />
        <Bar dataKey="qty" name="Satılan ədəd" fill="#047857" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
