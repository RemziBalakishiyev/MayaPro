import { useEffect, useState } from "react";
import { ArrowRight, Wallet } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney, parseMoneyInput } from "@/lib/format";
import { useCreateSalaryEntry } from "../queries";
import { SalaryConfirmSummary } from "./SalaryConfirmSummary";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  open: boolean;
  employee: EmployeeSalarySummary | null;
  month: string;
  onClose: () => void;
}

/**
 * "Maaş ödə" axını (FE#79, əvvəlki adı "Pul ver" — bax `docs/ui-terminology.md`).
 * İki addım: 1) məbləğ/qeyd forması (canlı "Qalıq" önizləməsi + kassa qeydi
 * əməliyyatdan ƏVVƏL görünür), 2) paylaşılan `ConfirmDialog` ilə son təsdiq
 * (AC-9/AC-10/AC-11) — həqiqi göndəriş YALNIZ təsdiq addımında baş verir.
 */
export function SalaryPayModal({ open, employee, month, onClose }: Props) {
  const toast = useToast();
  const createMut = useCreateSalaryEntry();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setError("");
      setConfirmOpen(false);
      setSubmitError(null);
    }
  }, [open, employee?.userId]);

  if (!employee) return null;

  const n = parseMoneyInput(amount) ?? 0;
  const remainingAfter = employee.remaining - n;

  const openConfirm = () => {
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      setError("Məbləğ sıfırdan böyük olmalıdır");
      return;
    }
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const submit = async () => {
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) return;
    setSubmitError(null);
    try {
      await createMut.mutateAsync({
        employeeId: employee.userId,
        input: { type: "payment", amount: parsed, note: note.trim() || undefined, month },
      });
      toast.success("Maaş ödənişi qeydə alındı — kassadan çıxdı");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ödəniş yazılmadı";
      setSubmitError(msg);
      // ConfirmModal `onConfirm` rədd olunanda dialoqu açıq saxlayır (F-43) —
      // xəta `error` propu ilə burada göstərilir.
      throw e;
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${employee.fullName} — Maaş ödə`}>
        <div className="space-y-3">
          <Field label="Məbləğ" required error={error}>
            <Input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError("");
              }}
              placeholder="0.00"
            />
          </Field>
          <Field label="Qeyd">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Məs: Avans"
            />
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
            <span className="text-sm font-semibold text-stone-600">Qalıq:</span>
            <span
              className={cn(
                "text-base font-bold tabular-nums",
                remainingAfter < 0 ? "text-orange-600" : "text-stone-900",
              )}
            >
              {fmtMoney(employee.remaining)} → {fmtMoney(remainingAfter)}
            </span>
          </div>

          {/* AC-11: kassa təsiri əməliyyatdan ƏVVƏL görünür (yalnız toast-da deyil). */}
          <p className="flex items-start gap-1.5 text-xs text-stone-500">
            <Wallet size={13} aria-hidden className="mt-0.5 shrink-0" />
            Kassadan çıxacaq — gün sonunda nəzərə alınır.
          </p>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              İmtina
            </Button>
            <Button
              type="button"
              onClick={openConfirm}
              icon={<ArrowRight size={15} />}
            >
              Davam et
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Maaş ödənişini təsdiqlə"
        message={
          <SalaryConfirmSummary
            employee={employee}
            month={month}
            amount={n}
            remainingAfter={remainingAfter}
            affectsCash
            warningText="Bu ödənişlə maaşdan artıq veriləcək."
          />
        }
        confirmText="Ödənişi təsdiqlə"
        isPending={createMut.isPending}
        error={submitError}
      />
    </>
  );
}
