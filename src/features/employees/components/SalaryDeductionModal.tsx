import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { parseMoneyInput } from "@/lib/format";
import { useCreateSalaryEntry } from "../queries";
import { DEDUCTION_REASONS, composeDeductionNote, type DeductionReason } from "../lib";
import { SalaryConfirmSummary } from "./SalaryConfirmSummary";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  open: boolean;
  employee: EmployeeSalarySummary | null;
  month: string;
  onClose: () => void;
}

/**
 * "Tutulma əlavə et" axını (FE#79, əvvəlki adı "Tutulma yaz"). İki addım:
 * 1) məbləğ + səbəb (hazır siyahı + sərbəst qeyd) forması, 2) paylaşılan
 * `ConfirmDialog` ilə son təsdiq (AC-9/AC-10) — işçi adı · ay · məbləğ ·
 * əməliyyatdan SONRAKI qalıq. Tutulma kassaya təsir ETMİR — kassa qeydi
 * göstərilmir (bax `SalaryConfirmSummary`-nin `affectsCash` propu).
 */
export function SalaryDeductionModal({ open, employee, month, onClose }: Props) {
  const toast = useToast();
  const createMut = useCreateSalaryEntry();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<DeductionReason>(DEDUCTION_REASONS[0]);
  const [freeText, setFreeText] = useState("");
  const [amountError, setAmountError] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setReason(DEDUCTION_REASONS[0]);
      setFreeText("");
      setAmountError("");
      setReasonError("");
      setConfirmOpen(false);
      setSubmitError(null);
    }
  }, [open, employee?.userId]);

  if (!employee) return null;

  const isOther = reason === "Digər";
  const n = parseMoneyInput(amount) ?? 0;
  const remainingAfter = employee.remaining - n;

  const openConfirm = () => {
    const parsed = parseMoneyInput(amount);
    const amtErr = parsed === null || parsed <= 0 ? "Məbləğ sıfırdan böyük olmalıdır" : "";
    const reasErr = isOther && !freeText.trim() ? "Səbəbi yazın" : "";
    setAmountError(amtErr);
    setReasonError(reasErr);
    if (amtErr || reasErr || parsed === null) return;
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
        input: {
          type: "deduction",
          amount: parsed,
          note: composeDeductionNote(reason, freeText),
          month,
        },
      });
      toast.success("Tutulma yazıldı — kassaya təsir etmir");
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tutulma yazılmadı";
      setSubmitError(msg);
      // ConfirmModal `onConfirm` rədd olunanda dialoqu açıq saxlayır (F-43) —
      // xəta `error` propu ilə burada göstərilir.
      throw e;
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={`${employee.fullName} — Tutulma əlavə et`}>
        <div className="space-y-3">
          <Field label="Məbləğ" required error={amountError}>
            <Input
              autoFocus
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (amountError) setAmountError("");
              }}
              placeholder="0.00"
            />
          </Field>
          <Field label="Səbəb" required error={reasonError}>
            <Select
              value={reason}
              onChange={(e) => {
                setReason(e.target.value as DeductionReason);
                if (reasonError) setReasonError("");
              }}
            >
              {DEDUCTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={isOther ? "Səbəbi yazın" : "Əlavə qeyd"} required={isOther}>
            <Input
              value={freeText}
              onChange={(e) => {
                setFreeText(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder={isOther ? "Məs: avadanlıq zədəsi" : "İstəyə görə"}
            />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>
              İmtina
            </Button>
            <Button type="button" onClick={openConfirm} icon={<ArrowRight size={15} />}>
              Davam et
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="Tutulmanı təsdiqlə"
        message={
          <SalaryConfirmSummary
            employee={employee}
            month={month}
            amount={n}
            remainingAfter={remainingAfter}
            warningText="Bu tutulma ilə maaşdan artıq veriləcək."
          />
        }
        confirmText="Tutulmanı təsdiqlə"
        isPending={createMut.isPending}
        error={submitError}
      />
    </>
  );
}
