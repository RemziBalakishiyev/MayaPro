import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useCreateTenant } from "../queries";

const PERIOD_OPTIONS = [1, 3, 6, 12];

/** FE#183 (AC-16/TC-20) — admin özü yeni mağaza yaradır: dərhal Active. */
export function NewTenantModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const createMut = useCreateTenant();
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [periodMonths, setPeriodMonths] = useState(3);
  const [monthlyFee, setMonthlyFee] = useState("");

  useEffect(() => {
    if (open) {
      setStoreName("");
      setOwnerName("");
      setPhone("");
      setPassword("");
      setPeriodMonths(3);
      setMonthlyFee("");
    }
  }, [open]);

  const passwordInvalid = password.trim() !== "" && password.trim().length < 6;
  const valid =
    storeName.trim() !== "" &&
    ownerName.trim() !== "" &&
    phone.trim() !== "" &&
    password.trim().length >= 6;

  const save = async () => {
    if (!valid) return;
    try {
      await createMut.mutateAsync({
        storeName,
        ownerName,
        phone,
        password,
        periodMonths,
        monthlyFee: monthlyFee.trim() === "" ? undefined : Number(monthlyFee),
      });
      toast.success(`${storeName.trim()} əlavə edildi`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Mağaza yaradıla bilmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni mağaza">
      <div className="space-y-3">
        <Field label="Mağaza adı" required>
          <Input autoFocus value={storeName} onChange={(e) => setStoreName(e.target.value)} />
        </Field>
        <Field label="Sahibkarın adı" required>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </Field>
        <Field label="Telefon" required>
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field
          label="Şifrə"
          required
          hint="Ən azı 6 simvol"
          error={passwordInvalid ? "Şifrə ən azı 6 simvol olmalıdır" : undefined}
        >
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="İlkin müddət (ay)" required>
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
        <Field label="Aylıq abunə haqqı" hint="İstəyə bağlı — sonradan dəyişdirilə bilər">
          <Input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={monthlyFee}
            onChange={(e) => setMonthlyFee(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          onClick={() => void save()}
          disabled={!valid}
          loading={createMut.isPending}
          icon={<Plus size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
