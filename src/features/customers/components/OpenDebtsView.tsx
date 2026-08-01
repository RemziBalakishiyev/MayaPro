import { useMemo } from "react";
import { HandCoins, Search } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { inputCls } from "@/components/ui/Input";
import { fmtMoney } from "@/lib/format";
import { phoneDigits } from "@/lib/phone";
import { useOpenDebts } from "../queries";
import { OpenDebtsTable } from "./OpenDebtsTable";
import type { Customer } from "@/types";

interface Props {
  q: string;
  onQChange: (q: string) => void;
  customers: Customer[];
  onPay: (customer: Customer) => void;
  onView: (customer: Customer) => void;
}

/**
 * FE#40 — "Borclar" görünüşü: BE#21 `GET /api/customers/open-debts` üzərində
 * StatCard (ümumi qalıq + açıq borc sayı) + axtarışlı cədvəl. Ümumi rəqəmlər
 * axtarışdan asılı olmayaraq bütün cavaba əsaslanır ki, "Müştəri üzrə"
 * görünüşündəki cəmlə üst-üstə düşsün.
 */
export function OpenDebtsView({
  q,
  onQChange,
  customers,
  onPay,
  onView,
}: Props) {
  const { data, isLoading } = useOpenDebts();
  const items = data?.items ?? [];
  const totalRemaining = data?.totalRemaining ?? 0;

  const customersById = useMemo(() => {
    const m = new Map<string, Customer>();
    customers.forEach((c) => m.set(c.id, c));
    return m;
  }, [customers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    const digits = phoneDigits(q);
    return items.filter((d) => {
      const nameOk = d.customerName.toLowerCase().includes(term);
      const phoneOk =
        (d.phone || "").toLowerCase().includes(term) ||
        (!!digits && phoneDigits(d.phone || "").includes(digits));
      const descOk = d.description.toLowerCase().includes(term);
      return nameOk || phoneOk || descOk;
    });
  }, [items, q]);

  const hasFilter = !!q.trim();

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          placeholder="Ad, telefon və ya mal adı üzrə axtar..."
          className={`${inputCls} pl-8`}
        />
      </div>

      <StatCard
        label="Ümumi qalıq borc"
        value={fmtMoney(totalRemaining)}
        sub={`${items.length} açıq borc`}
        icon={HandCoins}
        tone="red"
      />

      <OpenDebtsTable
        debts={filtered}
        isLoading={isLoading}
        customersById={customersById}
        onPay={onPay}
        onView={onView}
        emptyState={
          hasFilter
            ? {
                title: "Axtarışa uyğun borc yoxdur",
                description: "Axtarışı dəyişin.",
              }
            : undefined
        }
      />
    </div>
  );
}
