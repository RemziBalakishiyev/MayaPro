import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useAddCustomerPayment } from "../queries";
import type { Customer } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function PaymentModal({ open, onClose, customer }: Props) {
  const toast = useToast();
  const addPayment = useAddCustomerPayment();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
    }
  }, [open]);

  if (!customer) return null;

  const max = customer.remainingDebt;
  const n = Number(amount) || 0;
  const tooMuch = n > max;
  const valid = n > 0 && !tooMuch;

  const save = async () => {
    if (!valid) return;
    try {
      await addPayment.mutateAsync({
        customerId: customer.id,
        amount: n,
        note: note.trim() || undefined,
      });
      toast.success(`Ödəniş qəbul edildi: ${fmtMoney(n)}`);
      onClose();
    } catch {
      toast.error("Ödəniş alınmadı");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ödəniş əlavə et">
      <p className="mb-3 text-sm text-stone-600">
        <b>{customer.name}</b> — qalıq borc:{" "}
        <b className="text-red-600">{fmtMoney(max)}</b>
      </p>
      <div className="space-y-3">
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
        <Field label="Qeyd">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="İstəyə bağlı"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          onClick={save}
          disabled={!valid || addPayment.isPending}
          icon={<Check size={15} />}
        >
          Ödənişi qəbul et
        </Button>
      </div>
    </Modal>
  );
}
