import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useCreateSupplier } from "../queries";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewSupplierModal({ open, onClose }: Props) {
  const toast = useToast();
  const createMut = useCreateSupplier();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [initialDebt, setInitialDebt] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setPhone("");
      setInitialDebt("");
      setNote("");
    }
  }, [open]);

  const debtNum = Number(initialDebt);
  const debtInvalid =
    initialDebt.trim() !== "" && (!Number.isFinite(debtNum) || debtNum < 0);

  const save = async () => {
    if (!name.trim() || debtInvalid) return;
    try {
      await createMut.mutateAsync({
        name,
        phone,
        note: note.trim() || undefined,
        initialDebt:
          initialDebt.trim() === "" ? 0 : Math.max(0, debtNum),
      });
      toast.success("Təchizatçı əlavə edildi");
      onClose();
    } catch {
      toast.error("Təchizatçı yaradıla bilmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Yeni təchizatçı">
      <div className="space-y-3">
        <Field label="Ad" required>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Telefon">
          <PhoneInput value={phone} onChange={setPhone} />
        </Field>
        <Field
          label="İlkin borc (varsa)"
          hint="Bu təchizatçıya köhnədən qalan borcun — tarixçədə 'İlkin borc' kimi görünəcək"
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
          disabled={!name.trim() || debtInvalid}
          loading={createMut.isPending}
          icon={<Plus size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
