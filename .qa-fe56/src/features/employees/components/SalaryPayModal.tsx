import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney, parseMoneyInput } from "@/lib/format";
import { useCreateSalaryEntry } from "../queries";
import type { EmployeeSalarySummary } from "@/types";

interface Props {
  open: boolean;
  employee: EmployeeSalarySummary | null;
  month: string;
  onClose: () => void;
}

/** "Pul ver" modalı — məbləğ + qeyd, canlı "Qalıq" önizləməsi. */
export function SalaryPayModal({ open, employee, month, onClose }: Props) {
  const toast = useToast();
  const createMut = useCreateSalaryEntry();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setNote("");
      setError("");
    }
  }, [open, employee?.userId]);

  if (!employee) return null;

  const n = parseMoneyInput(amount) ?? 0;
  const remainingAfter = employee.remaining - n;

  const save = async () => {
    const parsed = parseMoneyInput(amount);
    if (parsed === null || parsed <= 0) {
      setError("Məbləğ sıfırdan böyük olmalıdır");
      return;
    }
    try {
      await createMut.mutateAsync({
        employeeId: employee.userId,
        input: { type: "payment", amount: parsed, note: note.trim() || undefined, month },
      });
      toast.success("Kassadan çıxacaq — gün sonunda nəzərə alınır");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ödəniş yazılmadı");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`${employee.fullName} — Pul ver`}>
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

        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
          <span className="text-sm font-semibold text-stone-600">Qalıq:</span>
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              remainingAfter < 0 ? "text-orange-600" : "text-stone-900",
            )}
          >
            {fmtMoney(remainingAfter)}
          </span>
        </div>

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
