import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { phoneDigits } from "@/lib/phone";
import {
  useSuppliers,
  useDeleteSupplier,
} from "@/features/suppliers/queries";
import { useCan } from "@/features/auth/store";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { SupplierDrawer } from "@/features/suppliers/components/SupplierDrawer";
import { NewSupplierModal } from "@/features/suppliers/components/NewSupplierModal";
import { EditSupplierModal } from "@/features/suppliers/components/EditSupplierModal";
import { DebtModal } from "@/features/suppliers/components/DebtModal";
import { PayModal } from "@/features/suppliers/components/PayModal";
import type { Supplier } from "@/types";

const searchSchema = z.object({
  /** Lokal axtarış — ad/əlaqə (telefon) üzrə, client-side (bənd 2). */
  q: z.string().optional(),
  /** [Hamısı] / [Borcum olanlar] sürətli görünüş seqmenti (bənd 3). */
  onlyDebtors: z.boolean().optional(),
});

export const Route = createFileRoute("/_app/tedarukculer")({
  validateSearch: searchSchema,
  component: TedarukculerPage,
});

function TedarukculerPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const toast = useToast();
  const {
    data: suppliers = [],
    isLoading,
    isError,
    refetch,
  } = useSuppliers();
  const canWrite = useCan()("suppliers.write");
  const deleteMut = useDeleteSupplier();

  const [selected, setSelected] = useState<Supplier | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editFor, setEditFor] = useState<Supplier | null>(null);
  const [deleteFor, setDeleteFor] = useState<Supplier | null>(null);
  const [debtFor, setDebtFor] = useState<Supplier | null>(null);
  const [payFor, setPayFor] = useState<Supplier | null>(null);

  // FE#75 (bənd 2/3) — lokal (client-side) axtarış ad/əlaqə (telefon) üzrə +
  // sürətli seqment ([Hamısı] / [Borcum olanlar]); siyahı onsuz da tam
  // gəlir (`useSuppliers`), YENİ API sorğusu ƏLAVƏ OLUNMUR.
  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    const qDigits = phoneDigits(search.q ?? "");
    return suppliers.filter((s) => {
      if (search.onlyDebtors && s.remainingDebt <= 0) return false;
      if (q) {
        const nameOk = s.name.toLowerCase().includes(q);
        const phoneOk =
          (s.phone || "").toLowerCase().includes(q) ||
          (!!qDigits && phoneDigits(s.phone).includes(qDigits));
        if (!nameOk && !phoneOk) return false;
      }
      return true;
    });
  }, [suppliers, search]);

  const totalDebt = useMemo(
    () => suppliers.reduce((s, x) => s + x.remainingDebt, 0),
    [suppliers],
  );

  const filteredDebt = useMemo(
    () => filtered.reduce((s, x) => s + x.remainingDebt, 0),
    [filtered],
  );

  const hasActiveFilters = !!(search.q ?? "").trim() || !!search.onlyDebtors;

  // Modal/drawer-lərə güncəl datanı ötür (əməliyyatdan sonra yenilənsin)
  const live = (s: Supplier | null) =>
    s ? (suppliers.find((x) => x.id === s.id) ?? null) : null;

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Təchizatçı silindi");
      if (selected?.id === deleteFor.id) setSelected(null);
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Təchizatçı silinmədi");
    }
  };

  return (
    <div>
      <PageHeader
        title="Təchizatçılar"
        subtitle={`${suppliers.length} təchizatçı · Mənim qalıq borcum: ${fmtMoney(totalDebt)}`}
        primaryAction={
          canWrite && (
            <Button size="md" icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
              Yeni təchizatçı
            </Button>
          )
        }
      />

      {/* FE#75 (bənd 2/3) — lokal axtarış + sürətli görünüş seqmenti BİR
          standart `TableToolbar`-da, Müştərilər (FE#73) səhifəsi ilə eyni
          vizual dil. Seçim URL-də saxlanılır (`onlyDebtors`). */}
      <TableToolbar
        search={
          <LocalTableSearch
            value={search.q ?? ""}
            onChange={(v) =>
              navigate({ search: (prev) => ({ ...prev, q: v || undefined }) })
            }
            placeholder="Bu siyahıda axtar... (ad və ya telefon)"
            ariaLabel="Təchizatçı siyahısında axtar"
            className="min-w-[220px] max-w-sm flex-1"
          />
        }
        actions={
          <div
            role="tablist"
            aria-label="Borc statusuna görə sürətli görünüş"
            className="flex shrink-0 gap-0.5 rounded-control border border-stone-200 bg-white p-1"
          >
            {(
              [
                { key: false, label: "Hamısı" },
                { key: true, label: "Borcum olanlar" },
              ] as const
            ).map(({ key, label }) => {
              const active = !!search.onlyDebtors === key;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() =>
                    navigate({
                      search: (prev) => ({
                        ...prev,
                        onlyDebtors: key || undefined,
                      }),
                    })
                  }
                  className={cn(
                    "min-h-[40px] whitespace-nowrap rounded-chip px-3.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        }
      />

      {/* `key` — axtarış/seqment dəyişəndə cədvəl yenidən mount olunur, daxili
          `TablePagination` səhifə 1-ə qayıdır (bənd 11; `SalesJournal.tsx`-dəki
          eyni naxış). */}
      <SuppliersTable
        key={`${search.q ?? ""}|${search.onlyDebtors ?? ""}`}
        suppliers={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        canWrite={canWrite}
        onView={setSelected}
        onAddDebt={setDebtFor}
        onPay={setPayFor}
        onEdit={setEditFor}
        onDelete={setDeleteFor}
        emptyState={
          hasActiveFilters
            ? {
                title: "Filterə uyğun təchizatçı yoxdur",
                description: "Axtarışı və ya «Borcum olanlar» görünüşünü dəyişin.",
              }
            : undefined
        }
      />
      {/* Müştərilər (FE#73, bənd 12) səhifəsindəki eyni "Görünən: N" xülasə
          sətri — səhifələmə (`TablePagination`) ÜMUMİ sayı göstərir, bu sətir
          isə CARİ FİLTRƏ uyğun görünən sayı. */}
      {!isLoading && filtered.length > 0 && (
        <p className="mt-2 flex items-center justify-end gap-1.5 px-1 text-xs text-stone-500">
          <span>Görünən:</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {filtered.length} təchizatçı
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {fmtMoney(filteredDebt)}
          </span>
          {hasActiveFilters && (
            <span className="text-stone-400">(filtrə uyğun)</span>
          )}
        </p>
      )}

      <SupplierDrawer
        supplier={live(selected)}
        onClose={() => setSelected(null)}
        onAddDebt={setDebtFor}
        onPay={setPayFor}
      />
      <NewSupplierModal open={newOpen} onClose={() => setNewOpen(false)} />
      <EditSupplierModal
        open={!!editFor}
        onClose={() => setEditFor(null)}
        supplier={live(editFor)}
      />
      <DebtModal
        open={!!debtFor}
        onClose={() => setDebtFor(null)}
        supplier={live(debtFor)}
      />
      <PayModal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        supplier={live(payFor)}
      />
      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Təchizatçını sil"
        message={
          deleteFor && deleteFor.remainingDebt > 0
            ? `Diqqət: ${deleteFor.name} təchizatçısına ${fmtMoney(deleteFor.remainingDebt)} borcunuz var. Silinsə, borc məlumatı da itəcək. Bu əməliyyat geri alına bilməz. Silmək istədiyinizə əminsiniz?`
            : `${deleteFor?.name ?? "Bu təchizatçı"} silinəcək. Bu əməliyyat geri alına bilməz.`
        }
        confirmText="Sil"
        danger
      />
    </div>
  );
}
