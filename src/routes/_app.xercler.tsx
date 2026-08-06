import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { isoInRange, type PeriodRange } from "@/components/ui/period-filter-lib";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useExpenses, useDeleteExpense } from "@/features/expenses/queries";
import { ExpensesTable } from "@/features/expenses/components/ExpensesTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { ExpenseDetailDrawer } from "@/features/expenses/components/ExpenseDetailDrawer";
import { ExpenseOutflowTag } from "@/features/expenses/components/amount-presentation";
import {
  ExpenseFilters,
  type ExpenseFilterValues,
} from "@/features/expenses/components/ExpenseFilters";
import { useProducts } from "@/features/products/queries";
import { useCan } from "@/features/auth/store";
import type { Expense } from "@/types";

const searchSchema = z.object({
  /** Axtarış — xərc adı və qeyd üzrə (boş sətir URL-dən silinir). */
  q: z.string().optional(),
  /**
   * FE#56 — paylaşılan PeriodFilter (əvvəlki `period` tab-ı əvəz edir).
   * Səhifənin əvvəlki defolt davranışı ("Bu ay") `PeriodFilter defaultKey="month"`
   * ilə qorunur.
   */
  from: z.string().optional(),
  to: z.string().optional(),
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
  const { source, type, q } = search;
  const range: PeriodRange = { from: search.from, to: search.to };

  // from/to birbaşa API sorğusuna gedir (BE#22). "Hamısı"da heç bir parametr göndərilmir.
  const {
    data: expenses = [],
    isLoading,
    isError,
    refetch,
  } = useExpenses(range);
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const canWrite = useCan()("expenses.write");
  const deleteMut = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteFor, setDeleteFor] = useState<Expense | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const updateRange = (patch: PeriodRange) =>
    navigate({
      search: (prev) => ({ ...prev, from: patch.from, to: patch.to }),
    });

  // Cədvəldə görünən sətirlər. Dövr süzgəci burada da tətbiq olunur: mock
  // rejimdə backend filtri yoxdur (bütün siyahı gəlir), real rejimdə isə
  // `isoInRange` API pəncərəsi ilə eyni nəticəni verir → ikiqat süzgəc zərərsizdir.
  const visibleExpenses = useMemo(() => {
    const needle = (q ?? "").trim().toLowerCase();
    return expenses.filter((e) => {
      if (!isoInRange(e.date, range.from, range.to)) return false;
      if (source !== "all" && e.source !== source) return false;
      if (type && e.category !== type) return false;
      if (
        needle &&
        !`${e.title} ${e.note ?? ""}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  }, [expenses, range.from, range.to, source, type, q]);

  // Alt cəm BÜTÜN filtrlənmiş sətirlərə aiddir — cədvəlin cari səhifəsinə yox.
  const filteredTotal = useMemo(
    () => visibleExpenses.reduce((s, e) => s + e.amount, 0),
    [visibleExpenses],
  );

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
    !!search.from || !!search.to || source !== "all" || !!type || !!q?.trim();

  return (
    <div>
      <PageHeader
        title="Xərclər"
        subtitle="Xərc qeydləri və mala bağlı maya təsiri"
        primaryAction={
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

      <PeriodFilter
        value={range}
        onChange={updateRange}
        defaultKey="month"
        className="mb-3"
      />

      <ExpenseFilters
        value={{ q, source, type }}
        onChange={updateFilter}
      />

      <ExpensesTable
        expenses={visibleExpenses}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        canWrite={canWrite}
        products={products}
        productsLoading={productsLoading}
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

      {/* FE#76 (AC-12/TC-13) — aydın etiketli xülasə sətri: "Görünən xərclər:
          N ədəd · 123.00 ₼". Hər filtr/axtarış/dövr dəyişikliyində eyni
          renderdə yenilənir (`filteredTotal` davranışı qorunub). Digər siyahı
          səhifələrinin (Müştərilər/Təchizatçılar) "Görünən: N" naxışı ilə
          eyni yerləşmə — səhifələmə (`TablePagination`) ÜMUMİ sayı göstərir,
          bu sətir isə CARİ FİLTRƏ uyğun görünən sayı/cəm. */}
      {!isLoading && visibleExpenses.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center justify-end gap-1.5 px-1 text-sm text-stone-600">
          <span className="font-semibold">Görünən xərclər:</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {visibleExpenses.length} ədəd
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-bold tabular-nums text-stone-900">
            {fmtMoney(filteredTotal)}
          </span>
          <ExpenseOutflowTag />
        </p>
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
