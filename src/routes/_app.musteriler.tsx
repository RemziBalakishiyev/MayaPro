import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LocalTableSearch } from "@/components/ui/LocalTableSearch";
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
  const { data: customers = [], isLoading } = useCustomers();
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

      {/* FE#69 — lokal cədvəl axtarışı paylaşılan `LocalTableSearch`-ə
          keçirildi: topbar-dakı qlobal axtarışdan həm görünüş, həm də
          placeholder mətni ilə fərqlənir (AC-14). URL search sxemi dəyişməyib. */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LocalTableSearch
          value={search.q ?? ""}
          onChange={(v) =>
            navigate({ search: (prev) => ({ ...prev, q: v || undefined }) })
          }
          placeholder="Bu siyahıda axtar... (ad və ya telefon)"
          ariaLabel="Müştəri siyahısında axtar"
          className="min-w-[220px] max-w-sm flex-1"
        />

        <label
          className={cn(
            "flex min-h-[44px] cursor-pointer items-center gap-2 rounded-control border bg-white px-3.5 text-sm font-medium",
            search.onlyDebtors
              ? "border-red-300 text-red-700"
              : "border-stone-200 text-stone-600",
          )}
        >
          <input
            type="checkbox"
            checked={!!search.onlyDebtors}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  onlyDebtors: e.target.checked || undefined,
                }),
              })
            }
            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          />
          Yalnız borclular
        </label>
      </div>

      <CustomersTable
        variant="all"
        customers={filtered}
        isLoading={isLoading}
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
                description: "Axtarışı və ya «yalnız borclular» filtri dəyişin.",
              }
            : undefined
        }
      />

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
