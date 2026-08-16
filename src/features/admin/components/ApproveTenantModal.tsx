import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtDate } from "@/lib/format";
import { useApproveTenant } from "../queries";
import type { Tenant } from "../types";

const PERIOD_OPTIONS = [1, 3, 6, 12];

/** FE#183 (AC-12) — "Gözləyir" statuslu mağazanı ay sayı seçərək təsdiqləmə modalı. */
export function ApproveTenantModal({
  open,
  onClose,
  tenant,
}: {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
}) {
  const toast = useToast();
  const approveMut = useApproveTenant();
  const [periodMonths, setPeriodMonths] = useState(3);

  useEffect(() => {
    if (open) setPeriodMonths(3);
  }, [open]);

  if (!tenant) return null;

  const newExpiry = new Date();
  newExpiry.setMonth(newExpiry.getMonth() + periodMonths);

  const save = async () => {
    try {
      await approveMut.mutateAsync({ id: tenant.id, periodMonths });
      toast.success(`${tenant.name} təsdiqləndi`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Təsdiqləmə uğursuz oldu");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Mağazanı təsdiqlə">
      <p className="mb-3 text-sm text-stone-600">
        <b>{tenant.name}</b> mağazasını təsdiqləyib aktivləşdirin.
      </p>
      <Field label="Müddət (ay)" required>
        <Select
          value={String(periodMonths)}
          onChange={(e) => setPeriodMonths(Number(e.target.value))}
        >
          {PERIOD_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} ay
            </option>
          ))}
        </Select>
      </Field>
      <p className="mt-3 text-sm text-stone-500">
        Yeni bitmə: <b className="text-stone-800">{fmtDate(newExpiry)}</b>
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={approveMut.isPending}>
          İmtina
        </Button>
        <Button onClick={() => void save()} loading={approveMut.isPending} icon={<CheckCircle2 size={15} />}>
          Təsdiqlə
        </Button>
      </div>
    </Modal>
  );
}
