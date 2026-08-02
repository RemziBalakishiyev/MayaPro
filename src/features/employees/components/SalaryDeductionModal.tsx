import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { parseMoneyInput } from "@/lib/format";
import { useCreateSalaryEntry } from "../queries";
import { DEDUCTION_REASONS, composeDeductionNote, type DeductionReason } from "../lib";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  open: boolean;
  employee: EmployeeSalarySummary | null;
  month: string;
  onClose: () => void;
}

/** "Tutulma yaz" modalı — məbləğ + səbəb (hazır siyahı + sərbəst qeyd). */
export function SalaryDeductionModal({ open, employee, month, onClose }: Props) {
  const toast = useToast();
  const createMut = useCreateSalaryEntry();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<DeductionReason>(DEDUCTION_REASONS[0]);
  const [freeText, setFreeText] = useState("");
  const [amountError, setAmountError] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setReason(DEDUCTION_REASONS[0]);
      setFreeText("");
      setAmountError("");
      setReasonError("");
    }
  }, [open, employee?.userId]);

  if (!employee) return null;

  const isOther = reason === "Digər";

  const save = async () => {
    const parsed = parseMoneyInput(amount);
    const amtErr = parsed === null || parsed <= 0 ? "Məbləğ sıfırdan böyük olmalıdır" : "";
    const reasErr = isOther && !freeText.trim() ? "Səbəbi yazın" : "";
    setAmountError(amtErr);
    setReasonError(reasErr);
    if (amtErr || reasErr || parsed === null) return;

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
      toast.error(e instanceof Error ? e.message : "Tutulma yazılmadı");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${employee.fullName} — Tutulma yaz`}>
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
          <Button
            type="button"
            onClick={() => void save()}
            disabled={createMut.isPending}
            icon={<Check size={15} />}
          >
            Təsdiq et
          </Button>
        </div>
      </div>
    </Modal>
  );
}
