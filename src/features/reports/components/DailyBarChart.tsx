import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import type { DailyPoint } from "../lib";

interface Props {
  data: DailyPoint[];
  /** Qazanc seriyasını da göstər (Hesabatlar üçün) */
  showProfit?: boolean;
  height?: number;
}

export function DailyBarChart({ data, showProfit, height = 300 }: Props) {
  const empty = data.every((d) => d.satis === 0 && d.qazanc === 0);
  if (empty) {
    return <EmptyState icon={BarChart3} title="Bu dövrdə satış yoxdur" />;
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => fmtMoney(Number(v))} />
        {showProfit && <Legend />}
        <Bar dataKey="satis" name="Satış" fill="#047857" radius={[4, 4, 0, 0]} />
        {showProfit && (
          <Bar dataKey="qazanc" name="Qazanc" fill="#b45309" radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
