import { useEffect, useState } from "react";
import { Check, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useAddCustomerPayment } from "../queries";
import type { DebtPaymentContext } from "../lib";
import type { Customer } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  /**
   * FE#74 (AC13/AC14) — "Borclar" cədvəlindəki bir sətirdən "Ödəniş al" ilə
   * açılanda hansı borc mənbəyindən (mal adı/tarix) gəldiyi. "Müştəri üzrə"
   * rejimindən / `CustomerDrawer`-dən açılanda ötürülmür — modal bu sətirsiz,
   * xətasız açılır (AC14). Forma sahələri/validasiya/submit axını DƏYİŞMİR —
   * yalnız bu kontekst məlumatı əlavə olunur.
   */
  context?: DebtPaymentContext | null;
}

export function PaymentModal({ open, onClose, customer, context }: Props) {
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
      <p className="mb-1 text-sm text-stone-600">
        <b>{customer.name}</b> — ümumi qalıq borc:{" "}
        <b className="text-red-600">{fmtMoney(max)}</b>
      </p>
      {/* FE#74 (AC13) — borc mənbəyi konteksti: hansı mal/tarixdən gəldiyi.
          AC14 — kontekst yoxdursa bu sətir sadəcə göstərilmir, modal sınmır. */}
      {context && (
        <p className="mb-1 text-xs text-stone-500">
          Mənbə: <b className="text-stone-700">{context.description}</b> ·{" "}
          {fmtDate(context.sourceDate)}
        </p>
      )}
      {/* FE#74 (AC12/AC13) — FIFO izahı sadə dillə: ödəniş müştərinin ÜMUMİ
          qalıq borcuna gedir, ən köhnə borcdan silinir. Ödəniş
          bölüşdürülməsi məntiqinə (backend FIFO) TOXUNULMUR — yalnız izah. */}
      <p className="mb-3 flex items-start gap-1.5 text-xs text-stone-500">
        <Info size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
        Ödəniş ümumi borcdan silinir (əvvəl köhnə borclar).
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
