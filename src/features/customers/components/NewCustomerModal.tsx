import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
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
}

export function NewCustomerModal({ open, onClose, onCreated }: Props) {
  const toast = useToast();
  const createMut = useCreateCustomer();
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
      const customer = await createMut.mutateAsync({
        name,
        phone,
        note: note.trim() || undefined,
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
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="994xxxxxxxxx"
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
          disabled={createMut.isPending}
          icon={<Plus size={15} />}
        >
          Əlavə et
        </Button>
      </div>
    </Modal>
  );
}
