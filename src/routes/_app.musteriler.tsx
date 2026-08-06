import { useEffect, useMemo, useState } from "react";
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
import { useCan } from "@/features/auth/store";
import {
  useCustomers,
  useDeleteCustomer,
} from "@/features/customers/queries";
import { CustomersTable } from "@/features/customers/components/CustomersTable";
import { CustomerDrawer } from "@/features/customers/components/CustomerDrawer";
import { PaymentModal } from "@/features/customers/components/PaymentModal";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { EditCustomerModal } from "@/features/customers/components/EditCustomerModal";
import type { Customer } from "@/types";

const searchSchema = z.object({
  q: z.string().optional(),
  /** Satış detalından deep-link — drawer açılır */
  customerId: z.string().optional(),
  /** "Yalnız borclular" toggle-u */
  onlyDebtors: z.boolean().optional(),
});

export const Route = createFileRoute("/_app/musteriler")({
  validateSearch: searchSchema,
  component: MusterilerPage,
});

function MusterilerPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const toast = useToast();
  const {
    data: customers = [],
    isLoading,
    isError,
    refetch,
  } = useCustomers();
  const canEdit = useCan()("customers.write");
  const canDelete = useCan()("customers.delete");
  const deleteMut = useDeleteCustomer();

  const [selected, setSelected] = useState<Customer | null>(null);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editFor, setEditFor] = useState<Customer | null>(null);
  const [deleteFor, setDeleteFor] = useState<Customer | null>(null);

  // Satış detalından ?customerId=… ilə gələndə drawer aç
  useEffect(() => {
    if (!search.customerId || customers.length === 0) return;
    const c = customers.find((x) => x.id === search.customerId);
    if (c) setSelected(c);
  }, [search.customerId, customers]);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    const qDigits = phoneDigits(search.q ?? "");
    return customers.filter((c) => {
      if (search.onlyDebtors && c.remainingDebt <= 0) return false;
      if (q) {
        const nameOk = c.name.toLowerCase().includes(q);
        const phoneOk =
          (c.phone || "").toLowerCase().includes(q) ||
          (!!qDigits && phoneDigits(c.phone).includes(qDigits));
        if (!nameOk && !phoneOk) return false;
      }
      return true;
    });
  }, [customers, search]);

  const totalPurchases = useMemo(
    () => customers.reduce((s, c) => s + (c.totalPurchases ?? 0), 0),
    [customers],
  );

  const filteredDebt = useMemo(
    () => filtered.reduce((s, c) => s + c.remainingDebt, 0),
    [filtered],
  );

  const hasActiveFilters = !!(search.q ?? "").trim() || !!search.onlyDebtors;

  const subtitle = `${customers.length} müştəri · Ümumi alış: ${fmtMoney(totalPurchases)}`;

  const liveSelected = selected
    ? (customers.find((c) => c.id === selected.id) ?? null)
    : null;
  const livePayFor = payFor
    ? (customers.find((c) => c.id === payFor.id) ?? null)
    : null;

  const handleDelete = async () => {
    if (!deleteFor) return;
    try {
      await deleteMut.mutateAsync(deleteFor.id);
      toast.success("Müştəri silindi");
      if (selected?.id === deleteFor.id) setSelected(null);
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Müştəri silinmədi");
    }
  };

  return (
    <div>
      <PageHeader
        title="Müştərilər"
        subtitle={subtitle}
        primaryAction={
          <Button
            size="md"
            icon={<Plus size={18} />}
            onClick={() => setNewOpen(true)}
          >
            Yeni müştəri
          </Button>
        }
      />

      {/* FE#69/FE#122/FE#73 — lokal cədvəl axtarışı + sürətli borc filtri
          paylaşılan `TableToolbar` (search/actions slot-ları) daxilində,
          BİR standart toolbar-da göstərilir (bənd 2). FE#73 ilə kiçik
          checkbox seqment düymələrinə ([Hamısı] / [Borcu olanlar]) keçdi
          (bənd 3) — URL search sxemi (`onlyDebtors`) dəyişməyib, seçim
          əvvəlki kimi URL-də əks olunur. */}
      <TableToolbar
        search={
          <LocalTableSearch
            value={search.q ?? ""}
            onChange={(v) =>
              navigate({ search: (prev) => ({ ...prev, q: v || undefined }) })
            }
            placeholder="Bu siyahıda axtar... (ad və ya telefon)"
            ariaLabel="Müştəri siyahısında axtar"
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
                { key: true, label: "Borcu olanlar" },
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

      <CustomersTable
        variant="all"
        customers={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        canEdit={canEdit}
        canDelete={canDelete}
        onView={setSelected}
        onPay={setPayFor}
        onEdit={setEditFor}
        onDelete={setDeleteFor}
        emptyState={
          (search.q ?? "").trim() || search.onlyDebtors
            ? {
                title: "Filterə uyğun müştəri yoxdur",
                description: "Axtarışı və ya «Borcu olanlar» görünüşünü dəyişin.",
              }
            : undefined
        }
      />
      {/* FE#73 (bənd 12) — "Nisyə Borclar" səhifəsindəki eyni "Görünən: N"
          xülasə sətri (`_app.borclar.tsx`) ilə üst-üstə: səhifələmə
          (`TablePagination`, `CustomersTable` daxilində) ÜMUMİ sətir
          sayını göstərir, bu sətir isə CARİ FİLTRƏ uyğun görünən sayı. */}
      {!isLoading && filtered.length > 0 && (
        <p className="mt-2 flex items-center justify-end gap-1.5 px-1 text-xs text-stone-500">
          <span>Görünən:</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {filtered.length} müştəri
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

      <CustomerDrawer
        customer={liveSelected}
        onClose={() => {
          setSelected(null);
          if (search.customerId) {
            navigate({
              search: (prev) => ({ ...prev, customerId: undefined }),
            });
          }
        }}
        onPay={setPayFor}
      />
      <PaymentModal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        customer={livePayFor}
      />
      <NewCustomerModal open={newOpen} onClose={() => setNewOpen(false)} />
      <EditCustomerModal
        open={!!editFor}
        onClose={() => setEditFor(null)}
        customer={
          editFor
            ? (customers.find((c) => c.id === editFor.id) ?? editFor)
            : null
        }
      />
      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Müştərini sil"
        message={
          deleteFor && deleteFor.remainingDebt > 0
            ? `Diqqət: ${deleteFor.name} müştərisinin ${fmtMoney(deleteFor.remainingDebt)} borcu var. Silinsə, borc məlumatı da itəcək. Bu əməliyyat geri alına bilməz. Silmək istədiyinizə əminsiniz?`
            : `${deleteFor?.name ?? "Bu müştəri"} silinəcək. Bu əməliyyat geri alına bilməz.`
        }
        confirmText="Sil"
        danger
      />
    </div>
  );
}
