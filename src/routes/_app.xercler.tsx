import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { PeriodFilter } from "@/components/ui/PeriodFilter";
import { isoInRange, type PeriodRange } from "@/components/ui/period-filter-lib";
import { useToast } from "@/components/ui/toast-store";
import { StaleDataBanner } from "@/components/ui/StaleDataBanner";
import { fmtMoney } from "@/lib/format";
import { useExpenses, useDeleteExpense } from "@/features/expenses/queries";
import { ExpensesTable } from "@/features/expenses/components/ExpensesTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { ExpenseDetailDrawer } from "@/features/expenses/components/ExpenseDetailDrawer";
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
    error,
    refetch,
  } = useExpenses(range);
  const { data: products = [] } = useProducts();
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
    !!search.from || !!search.to || source !== "all" || !!type || !!q?.trim();

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

      {/*
       * FE#134: tam xəta bloku YALNIZ göstəriləcək data heç olmadıqda
       * (`expenses.length === 0`) görünür. Əvvəl uğurla yüklənmiş xərclər
       * varkən arxa-fon refetch-i uğursuz olarsa, TanStack Query `data`-nı
       * ƏVVƏLKİ nəticə ilə saxlayır — bu halda mövcud siyahı qalır, üstündə
       * yalnız kiçik "yenilənmə uğursuz oldu" xəbərdarlıq zolağı göstərilir.
       */}
      {isError && expenses.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm font-medium text-red-700">
          {error instanceof Error ? error.message : "Xərclər yüklənmədi"}
        </div>
      ) : (
        <>
          {isError && (
            <StaleDataBanner
              message="Xərclər yenilənmədi — göstərilən siyahı köhnəlmiş ola bilər."
              onRetry={() => void refetch()}
              className="mb-3"
            />
          )}
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
