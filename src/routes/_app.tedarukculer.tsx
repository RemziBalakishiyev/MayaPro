import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
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

export const Route = createFileRoute("/_app/tedarukculer")({
  component: TedarukculerPage,
});

function TedarukculerPage() {
  const toast = useToast();
  const { data: suppliers = [], isLoading } = useSuppliers();
  const canWrite = useCan()("suppliers.write");
  const deleteMut = useDeleteSupplier();

  const [selected, setSelected] = useState<Supplier | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editFor, setEditFor] = useState<Supplier | null>(null);
  const [deleteFor, setDeleteFor] = useState<Supplier | null>(null);
  const [debtFor, setDebtFor] = useState<Supplier | null>(null);
  const [payFor, setPayFor] = useState<Supplier | null>(null);

  const totalDebt = useMemo(
    () => suppliers.reduce((s, x) => s + x.remainingDebt, 0),
    [suppliers],
  );

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
      <PageHead
        title="Təchizatçılar"
        subtitle={`${suppliers.length} təchizatçı · Mənim qalıq borcum: ${fmtMoney(totalDebt)}`}
        actions={
          canWrite && (
            <Button size="md" icon={<Plus size={18} />} onClick={() => setNewOpen(true)}>
              Yeni təchizatçı
            </Button>
          )
        }
      />

      <SuppliersTable
        suppliers={suppliers}
        isLoading={isLoading}
        canWrite={canWrite}
        onView={setSelected}
        onAddDebt={setDebtFor}
        onPay={setPayFor}
        onEdit={setEditFor}
        onDelete={setDeleteFor}
      />

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
        message={`${deleteFor?.name ?? "Bu təchizatçı"} silinəcək. Bu əməliyyat geri alına bilməz.`}
        confirmText="Sil"
        danger
      />
    </div>
  );
}
