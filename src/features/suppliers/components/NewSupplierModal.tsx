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
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setPhone("");
      setNote("");
    }
  }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await createMut.mutateAsync({ name, phone, note: note.trim() || undefined });
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
          disabled={createMut.isPending}
          icon={<Plus size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
