import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useCategories, useCreateCategory } from "../queries";

const NEW_CATEGORY = "__new__";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

/** Kateqoriya seçimi + select-in içində son seçim olaraq "yeni yaratma". */
export function CategoryField({ value, onChange }: Props) {
  const toast = useToast();
  const categories = useCategories();
  const createCat = useCreateCategory();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const submitNew = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const cat = await createCat.mutateAsync(name);
      onChange(cat.name);
      setNewName("");
      setAdding(false);
      toast.success("Kateqoriya yaradıldı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kateqoriya yaradılmadı");
    }
  };

  if (adding) {
    return (
      <div className="flex items-center gap-2">
        <Input
          autoFocus
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Yeni kateqoriya adı"
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
          disabled={createCat.isPending}
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

  const cats = categories.data ?? [];
  // Köhnə malın kateqoriyası siyahıda yoxdursa, onu da seçim kimi saxla.
  const missing = value && !cats.some((c) => c.name === value);

  return (
    <Select
      value={value}
      onChange={(e) => {
        if (e.target.value === NEW_CATEGORY) setAdding(true);
        else onChange(e.target.value);
      }}
    >
      <option value="">Seçin...</option>
      {missing && <option value={value}>{value}</option>}
      {cats.map((c) => (
        <option key={c.id} value={c.name}>
          {c.name}
        </option>
      ))}
      <option value={NEW_CATEGORY}>+ Yeni kateqoriya</option>
    </Select>
  );
}
