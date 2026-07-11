import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Plus, Search } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { inputCls } from "@/components/ui/Input";
import { fmtMoney } from "@/lib/format";
import { useCustomers } from "@/features/customers/queries";
import { CustomersTable } from "@/features/customers/components/CustomersTable";
import { CustomerDrawer } from "@/features/customers/components/CustomerDrawer";
import { PaymentModal } from "@/features/customers/components/PaymentModal";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import type { Customer } from "@/types";

const searchSchema = z.object({
  q: z.string().optional(),
  borclu: z.boolean().optional(),
});

export const Route = createFileRoute("/_app/borclar")({
  validateSearch: searchSchema,
  component: BorclarPage,
});

function BorclarPage() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();
  const { data: customers = [], isLoading } = useCustomers();

  const [selected, setSelected] = useState<Customer | null>(null);
  const [payFor, setPayFor] = useState<Customer | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase();
    return customers.filter((c) => {
      if (search.borclu && c.remainingDebt <= 0) return false;
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !(c.phone || "").includes(q)
      )
        return false;
      return true;
    });
  }, [customers, search]);

  const totalDebt = useMemo(
    () => customers.reduce((s, c) => s + c.remainingDebt, 0),
    [customers],
  );

  // Seçilmiş müştərini cədvəldəki güncəl datadan götür (ödənişdən sonra yenilənsin)
  const liveSelected = selected
    ? (customers.find((c) => c.id === selected.id) ?? null)
    : null;
  const livePayFor = payFor
    ? (customers.find((c) => c.id === payFor.id) ?? null)
    : null;

  return (
    <div>
      <PageHead
        title="Nisyə Borclar"
        subtitle={`${customers.length} müştəri · Ümumi qalıq borc: ${fmtMoney(totalDebt)}`}
        actions={
          <Button size="md" icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
            Yeni müştəri
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={search.q ?? ""}
            onChange={(e) =>
              navigate({
                search: (prev) => ({ ...prev, q: e.target.value || undefined }),
              })
            }
            placeholder="Ad və ya telefon üzrə axtar..."
            className={`${inputCls} pl-8`}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
          <input
            type="checkbox"
            checked={!!search.borclu}
            onChange={(e) =>
              navigate({
                search: (prev) => ({
                  ...prev,
                  borclu: e.target.checked || undefined,
                }),
              })
            }
            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          />
          Yalnız borclular
        </label>
      </div>

      <CustomersTable
        customers={filtered}
        isLoading={isLoading}
        onView={setSelected}
        onPay={setPayFor}
      />

      <CustomerDrawer
        customer={liveSelected}
        onClose={() => setSelected(null)}
        onPay={setPayFor}
      />
      <PaymentModal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        customer={livePayFor}
      />
      <NewCustomerModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
