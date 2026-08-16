import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useAddTenantPayment } from "../queries";
import type { Tenant } from "../types";

/** FE#183 (AC-14/TC-16/TC-17) — ödəniş yazma: məbləğ + ay sayı + qeyd, canlı "Yeni bitmə" önizləməsi. */
export function RecordPaymentModal({
  open,
  onClose,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}) {
  const toast = useToast();
  const addPayment = useAddTenantPayment();
  const [amount, setAmount] = useState("");
  const [periodMonths, setPeriodMonths] = useState("1");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setPeriodMonths("1");
      setNote("");
    }
  }, [open]);

  if (!tenant) return null;

  const amountNum = Number(amount);
  const monthsNum = Number(periodMonths);
  const amountInvalid = amount.trim() === "" || !Number.isFinite(amountNum) || amountNum <= 0;
  const monthsInvalid =
    periodMonths.trim() === "" || !Number.isInteger(monthsNum) || monthsNum <= 0;
  const valid = !amountInvalid && !monthsInvalid;

  // Backend qaydası (`RecordPaymentHandler`): ExpiresAt = max(indi, mövcud ExpiresAt) + N ay.
  const newExpiry = (() => {
    const now = new Date();
    const current = tenant.expiresAt ? new Date(tenant.expiresAt) : now;
    const base = current > now ? current : now;
    if (!monthsInvalid) base.setMonth(base.getMonth() + monthsNum);
    return base;
  })();

  const save = async () => {
    if (!valid) return;
    try {
      await addPayment.mutateAsync({
        id: tenant.id,
        input: { amount: amountNum, periodMonths: monthsNum, note: note.trim() || undefined },
      });
      toast.success(`Ödəniş qeydə alındı: ${fmtMoney(amountNum)}`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ödəniş yazıla bilmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ödəniş yaz">
      <p className="mb-3 text-sm text-stone-600">
        <b>{tenant.name}</b> üçün abunə ödənişi qeydə alınır.
      </p>
      <div className="space-y-3">
        <Field
          label="Məbləğ"
          required
          error={amount.trim() !== "" && amountInvalid ? "Məbləğ 0-dan böyük olmalıdır" : undefined}
        >
          <Input
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field
          label="Ay sayı"
          required
          error={
            periodMonths.trim() !== "" && monthsInvalid
              ? "Ay sayı 1 və ya daha çox olmalıdır"
              : undefined
          }
        >
          <Input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={periodMonths}
            onChange={(e) => setPeriodMonths(e.target.value)}
          />
        </Field>
        <Field label="Qeyd">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="İstəyə bağlı" />
        </Field>
      </div>

      <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
        Yeni bitmə: {valid ? fmtDate(newExpiry) : "—"}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={addPayment.isPending}>
          İmtina
        </Button>
        <Button
          onClick={() => void save()}
          disabled={!valid}
          loading={addPayment.isPending}
          icon={<Check size={15} />}
        >
          Ödənişi qeydə al
        </Button>
      </div>
    </Modal>
  );
}
