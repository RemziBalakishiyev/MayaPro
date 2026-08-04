import { useEffect, useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { useAdjustStock } from "../queries";
import type { StockMode } from "./ProductsTable";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  mode: StockMode;
}

export function StockAdjustModal({ open, onClose, product, mode }: Props) {
  const toast = useToast();
  const adjustMut = useAdjustStock();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setReason("");
    }
  }, [open]);

  if (!product) return null;

  const apply = async () => {
    const n = Number(amount) || 0;
    if (n <= 0) return;
    try {
      await adjustMut.mutateAsync({
        id: product.id,
        delta: mode === "add" ? n : -n,
        reason: reason.trim() || undefined,
      });
      toast.success(
        `Stok ${mode === "add" ? "artırıldı" : "azaldıldı"}: ${product.name}`,
      );
      onClose();
    } catch {
      toast.error("Stok düzəlişi alınmadı");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "add" ? "Stok artır" : "Stok azalt"}
    >
      <p className="mb-3 text-sm text-stone-600">
        <b>{product.name}</b> — hazırkı stok: <b>{product.quantity} əd.</b>
      </p>
      <div className="space-y-3">
        <Field label="Miqdar" required>
          <Input
            type="number"
            min="1"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
          />
        </Field>
        <Field label="Səbəb / qeyd">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Məs: yeni partiya, zay mal, inventar düzəlişi..."
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          İmtina
        </Button>
        <Button
          onClick={apply}
          disabled={adjustMut.isPending}
          icon={mode === "add" ? <Plus size={15} /> : <Minus size={15} />}
        >
          Tətbiq et
        </Button>
      </div>
    </Modal>
  );
}
