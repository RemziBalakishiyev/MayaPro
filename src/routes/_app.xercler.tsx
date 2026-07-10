import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Receipt } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { fmtMoney, todayISO } from "@/lib/format";
import { useExpenses } from "@/features/expenses/queries";
import { ExpensesTable } from "@/features/expenses/components/ExpensesTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { useProducts } from "@/features/products/queries";

const searchSchema = z.object({
  month: z.string().optional(), // "YYYY-MM"
});

export const Route = createFileRoute("/_app/xercler")({
  validateSearch: searchSchema,
  component: XerclerPage,
});

function XerclerPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: products = [] } = useProducts();
  const [formOpen, setFormOpen] = useState(false);

  const month = search.month ?? todayISO().slice(0, 7);

  const filtered = useMemo(
    () => expenses.filter((e) => e.date.slice(0, 7) === month),
    [expenses, month],
  );

  const monthTotal = useMemo(
    () => filtered.reduce((s, e) => s + e.amount, 0),
    [filtered],
  );

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string | null) =>
      id ? (map.get(id) ?? "—") : "Ümumi xərc";
  }, [products]);

  return (
    <div>
      <PageHead
        title="Xərclər"
        subtitle="Xərc qeydləri və mala bağlı maya təsiri"
        actions={
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setFormOpen(true)}>
            Yeni xərc
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          Ay:
          <input
            type="month"
            value={month}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  month: e.target.value || undefined,
                }),
              })
            }
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="w-full sm:w-56">
          <StatCard
            label="Bu ay üzrə cəmi xərc"
            value={fmtMoney(monthTotal)}
            sub={`${filtered.length} qeyd`}
            icon={Receipt}
            tone="red"
          />
        </div>
      </div>

      <ExpensesTable
        expenses={filtered}
        isLoading={isLoading}
        productName={productName}
      />

      <ExpenseForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
