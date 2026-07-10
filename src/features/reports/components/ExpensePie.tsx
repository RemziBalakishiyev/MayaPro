import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Receipt } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney } from "@/lib/format";
import { PIE_COLORS, type NamedValue } from "../lib";

interface Props {
  data: NamedValue[];
  height?: number;
}

export function ExpensePie({ data, height = 230 }: Props) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) {
    return <EmptyState icon={Receipt} title="Xərc datası yoxdur" />;
  }
  return (
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
        <Tooltip formatter={(v) => fmtMoney(Number(v))} />
      </PieChart>
    </ResponsiveContainer>
  );
}
