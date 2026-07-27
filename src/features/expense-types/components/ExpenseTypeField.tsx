import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useExpenseTypes, useCreateExpenseType } from "../queries";

const NEW_TYPE = "__new__";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Xərc növü seçimi + select-in içində son seçim olaraq "yeni yaratma" (CategoryField ilə eyni model). */
export function ExpenseTypeField({ value, onChange }: Props) {
  const toast = useToast();
  const types = useExpenseTypes();
  const createType = useCreateExpenseType();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const submitNew = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const type = await createType.mutateAsync(name);
      onChange(type.name);
      setNewName("");
      setAdding(false);
      toast.success("Xərc növü yaradıldı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xərc növü yaradılmadı");
    }
  };

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni xərc növü adı"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void submitNew();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={submitNew}
          disabled={createType.isPending}
          icon={<Check size={14} />}
        >
          Yarat
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setAdding(false);
            setNewName("");
          }}
        >
          İmtina
        </Button>
      </div>
    );
  }

  const items = types.data ?? [];
  // Köhnə xərcin növü siyahıda yoxdursa, onu da seçim kimi saxla.
  const missing = value && !items.some((t) => t.name === value);

  return (
    <Select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_TYPE) setAdding(true);
        else onChange(e.target.value);
      }}
    >
      <option value="">Seçin...</option>
      {missing && <option value={value}>{value}</option>}
      {items.map((t) => (
        <option key={t.id} value={t.name}>
          {t.name}
        </option>
      ))}
      <option value={NEW_TYPE}>+ Yeni xərc növü</option>
    </Select>
  );
}
