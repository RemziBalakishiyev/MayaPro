import { useEffect, useState } from "react";
import { HandCoins } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useAddSupplierPayment } from "../queries";
import type { Supplier } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

/** Təchizatçıya ödəniş → borcum azalır. */
export function PayModal({ open, onClose, supplier }: Props) {
  const toast = useToast();
  const addPayment = useAddSupplierPayment();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  if (!supplier) return null;

  const max = supplier.remainingDebt;
  const n = Number(amount) || 0;
  const tooMuch = n > max;
  const valid = n > 0 && !tooMuch;

  const save = async () => {
    if (!valid) return;
    try {
      await addPayment.mutateAsync({ supplierId: supplier.id, amount: n });
      toast.success(`Ödəniş edildi: ${fmtMoney(n)}`);
      onClose();
    } catch {
      toast.error("Ödəniş alınmadı");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Ödəniş et — ${supplier.name}`}>
      <p className="mb-3 text-sm text-stone-600">
        Cari qalıq borc:{" "}
        <b className="text-red-600">{fmtMoney(max)}</b>
      </p>
      <Field
        label="Məbləğ"
        required
        hint={`Maksimum: ${fmtMoney(max)}`}
        error={tooMuch ? "Məbləğ qalıq borcdan çox ola bilməz" : undefined}
      >
        <Input
          type="number"
          min="1"
          max={max}
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
          onClick={save}
          disabled={!valid || addPayment.isPending}
          icon={<HandCoins size={15} />}
        >
          Ödənişi et
        </Button>
      </div>
    </Modal>
  );
}
