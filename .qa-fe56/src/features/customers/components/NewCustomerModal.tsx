import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useCreateCustomer } from "../queries";
import type { Customer } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Yaradılan müştəri — çağıran onu avtomatik seçə bilsin. */
  onCreated?: (customer: Customer) => void;
  /** Açılanda ad sahəsinə yazılacaq ilkin dəyər (autocomplete-dən). */
  initialName?: string;
}

export function NewCustomerModal({
  open,
  onClose,
  onCreated,
  initialName = "",
}: Props) {
  const toast = useToast();
  const createMut = useCreateCustomer();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [initialDebt, setInitialDebt] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName.trim());
      setPhone("");
      setInitialDebt("");
      setNote("");
    }
  }, [open, initialName]);

  const debtNum = Number(initialDebt);
  const debtInvalid =
    initialDebt.trim() !== "" && (!Number.isFinite(debtNum) || debtNum < 0);

  const save = async () => {
    if (!name.trim() || debtInvalid) return;
    try {
      const customer = await createMut.mutateAsync({
        name,
        phone,
        note: note.trim() || undefined,
        initialDebt:
          initialDebt.trim() === "" ? 0 : Math.max(0, debtNum),
      });
      toast.success("Yeni müştəri əlavə edildi");
      onCreated?.(customer);
      onClose();
    } catch {
      toast.error("Müştəri yaradıla bilmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni müştəri">
      <div className="space-y-3">
        <Field label="Müştəri adı" required>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Telefon">
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field
          label="İlkin borc (varsa)"
          hint="Köhnə dəftərdən qalan borc — tarixçədə 'İlkin borc' kimi görünəcək"
          error={debtInvalid ? "İlkin borc 0 və ya daha böyük olmalıdır" : undefined}
        >
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="0"
            value={initialDebt}
            onChange={(e) => setInitialDebt(e.target.value)}
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
          disabled={createMut.isPending || !name.trim() || debtInvalid}
          icon={<Plus size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
