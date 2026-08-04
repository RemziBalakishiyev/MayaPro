import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useAddSupplierDebt } from "../queries";
import type { Supplier } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

/** Mal alışı → təchizatçıya borcum artır. */
export function DebtModal({ open, onClose, supplier }: Props) {
  const toast = useToast();
  const addDebt = useAddSupplierDebt();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  if (!supplier) return null;

  const save = async () => {
    const n = Number(amount) || 0;
    if (n <= 0) return;
    try {
      await addDebt.mutateAsync({ supplierId: supplier.id, amount: n });
      toast.info(`Borc əlavə edildi: ${fmtMoney(n)}`);
      onClose();
    } catch {
      toast.error("Əməliyyat alınmadı");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Borc əlavə et — ${supplier.name}`}>
      <p className="mb-3 text-sm text-stone-600">
        Cari qalıq borc:{" "}
        <b className="text-red-600">{fmtMoney(supplier.remainingDebt)}</b>
      </p>
      <Field label="Məbləğ" required>
        <Input
          type="number"
          min="1"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          variant="warn"
          onClick={save}
          disabled={addDebt.isPending}
          icon={<Plus size={15} />}
        >
          Borc əlavə et
        </Button>
      </div>
    </Modal>
  );
}
