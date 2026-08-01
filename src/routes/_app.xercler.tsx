import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { inPeriod } from "@/features/reports/lib";
import { useExpenses, useDeleteExpense } from "@/features/expenses/queries";
import { ExpensesTable } from "@/features/expenses/components/ExpensesTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { ExpenseDetailDrawer } from "@/features/expenses/components/ExpenseDetailDrawer";
import {
  DEFAULT_EXPENSE_PERIOD,
  ExpenseFilters,
  type ExpenseFilterValues,
} from "@/features/expenses/components/ExpenseFilters";
import { expensePeriodToRange } from "@/features/expenses/lib";
import { useProducts } from "@/features/products/queries";
import { useCan } from "@/features/auth/store";
import type { Expense } from "@/types";

const searchSchema = z.object({
  /** Axtarış — xərc adı və qeyd üzrə (boş sətir URL-dən silinir). */
  q: z.string().optional(),
  /**
   * Filtrlər URL-də saxlanılır (F5-dən sonra itmir).
   * `.catch` → keçərsiz dəyər (məs. ?period=xyz) route xətası vermir, defolta düşür.
   */
  period: z
    .enum(["today", "week", "month", "year", "all"])
    .default(DEFAULT_EXPENSE_PERIOD)
    .catch(DEFAULT_EXPENSE_PERIOD),
  source: z.enum(["all", "general", "product"]).default("all").catch("all"),
  /** Xərc növü (expense-types siyahısındakı ad). */
  type: z.string().optional(),
});

export const Route = createFileRoute("/_app/xercler")({
  validateSearch: searchSchema,
  component: XerclerPage,
});

function XerclerPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const toast = useToast();
  const { period, source, type, q } = search;

  // Dövr → from/to (təqvim ayı/il semantikası) → API sorğusu (BE#22).
  // "Hamısı"da heç bir parametr göndərilmir.
  const range = useMemo(() => expensePeriodToRange(period), [period]);
  const {
    data: expenses = [],
    isLoading,
    isError,
    error,
  } = useExpenses(range);
  const { data: products = [] } = useProducts();
  const canWrite = useCan()("expenses.write");
  const deleteMut = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteFor, setDeleteFor] = useState<Expense | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Cədvəldə görünən sətirlər. Dövr süzgəci burada da tətbiq olunur: mock
  // rejimdə backend filtri yoxdur (bütün siyahı gəlir), real rejimdə isə
  // `inPeriod` API pəncərəsi ilə eyni nəticəni verir → ikiqat süzgəc zərərsizdir.
  const visibleExpenses = useMemo(() => {
    const needle = (q ?? "").trim().toLowerCase();
    return expenses.filter((e) => {
      if (!inPeriod(e.date, period)) return false;
      if (source !== "all" && e.source !== source) return false;
      if (type && e.category !== type) return false;
      if (
        needle &&
        !`${e.title} ${e.note ?? ""}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [expenses, period, source, type, q]);

  // Alt cəm BÜTÜN filtrlənmiş sətirlərə aiddir — cədvəlin cari səhifəsinə yox.
  const filteredTotal = useMemo(
    () => visibleExpenses.reduce((s, e) => s + e.amount, 0),
    [visibleExpenses],
  );

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "Ümumi xərc");
  }, [products]);

  // Detal draweri id üzrə işləyir: xərc silinəndə/siyahıdan çıxanda drawer
  // avtomatik bağlanır (köhnəlmiş məlumat ekranda qalmır).
  const detailExpense = useMemo(
    () => expenses.find((e) => e.id === detailId) ?? null,
    [expenses, detailId],
  );

  const updateFilter = (patch: Partial<ExpenseFilterValues>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Xərc silindi");
      if (detailId === deleteFor.id) setDetailId(null);
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xərc silinmədi");
    }
  };

  const hasFilter =
    period !== DEFAULT_EXPENSE_PERIOD ||
    source !== "all" ||
    !!type ||
    !!q?.trim();

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

      <ExpenseFilters
        value={{ q, period, source, type }}
        onChange={updateFilter}
      />

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm font-medium text-red-700">
          {error instanceof Error ? error.message : "Xərclər yüklənmədi"}
        </div>
      ) : (
        <>
          <ExpensesTable
            expenses={visibleExpenses}
            isLoading={isLoading}
            canWrite={canWrite}
            productName={productName}
            emptyState={{
              title: "Xərc tapılmadı",
              description: hasFilter
                ? "Filtrə uyğun xərc yoxdur — filtrləri dəyişin və ya təmizləyin."
                : "«Yeni xərc» düyməsi ilə ilk xərci əlavə edin.",
            }}
            onRowClick={(e) => setDetailId(e.id)}
            onEdit={openEdit}
            onDelete={setDeleteFor}
          />

          {/* Canlı cəm — hər filtr dəyişikliyində eyni renderdə yenilənir. */}
          {!isLoading && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 px-4 py-3">
              <span className="text-sm font-semibold text-stone-600">
                Cəmi (filtrlənmiş):
              </span>
              <span className="text-lg font-bold tabular-nums text-red-600">
                {fmtMoney(filteredTotal)}
              </span>
            </div>
          )}
        </>
      )}

      <ExpenseDetailDrawer
        expense={detailExpense}
        canWrite={canWrite}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
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
