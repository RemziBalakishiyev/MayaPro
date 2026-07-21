import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Receipt } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney, todayISO } from "@/lib/format";
import {
  useExpenses,
  useDeleteExpense,
} from "@/features/expenses/queries";
import { ExpensesTable } from "@/features/expenses/components/ExpensesTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { useProducts } from "@/features/products/queries";
import { useCan } from "@/features/auth/store";
import type { Expense } from "@/types";

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
  const toast = useToast();
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: products = [] } = useProducts();
  const canWrite = useCan()("expenses.write");
  const deleteMut = useDeleteExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteFor, setDeleteFor] = useState<Expense | null>(null);

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

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Xərc silindi");
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xərc silinmədi");
    }
  };

  return (
    <div>
      <PageHead
        title="Xərclər"
        subtitle="Xərc qeydləri və mala bağlı maya təsiri"
        actions={
          canWrite && (
            <Button
              size="md"
              icon={<Plus size={18} />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Yeni xərc
            </Button>
          )
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
        canWrite={canWrite}
        productName={productName}
        onEdit={(e) => {
          setEditing(e);
          setFormOpen(true);
        }}
        onDelete={setDeleteFor}
      />

      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        initial={editing}
      />
      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Xərci sil"
        message={
          deleteFor?.productId
            ? "Malın real mayası yenidən hesablanacaq"
            : "Bu xərc silinəcək. Bu əməliyyat geri alına bilməz."
        }
        confirmText="Sil"
        danger
      />
    </div>
  );
}
