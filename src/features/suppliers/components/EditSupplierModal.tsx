import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useUpdateSupplier } from "../queries";
import type { Supplier } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export function EditSupplierModal({ open, onClose, supplier }: Props) {
  const toast = useToast();
  const updateMut = useUpdateSupplier();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open && supplier) {
      setName(supplier.name);
      setPhone(supplier.phone || "");
      setNote(supplier.note || "");
    }
  }, [open, supplier]);

  const save = async () => {
    if (!supplier || !name.trim()) return;
    try {
      await updateMut.mutateAsync({
        id: supplier.id,
        input: {
          name,
          phone,
          note: note.trim() || undefined,
        },
      });
      toast.success("Təchizatçı yeniləndi");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Təchizatçı yenilənmədi");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Təchizatçını düzəliş et">
      <div className="space-y-3">
        <Field label="Ad" required>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
          onClick={() => void save()}
          disabled={updateMut.isPending || !name.trim()}
          icon={<Check size={15} />}
        >
          Yadda saxla
        </Button>
      </div>
    </Modal>
  );
}
