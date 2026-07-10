import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { fmtMoney } from "@/lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Gözlənilən ziyan məbləği (müsbət ədəd kimi). */
  lossAmount: number;
}

/** Ziyanla satışda təsdiq modalı. */
export function LossConfirmModal({
  open,
  onClose,
  onConfirm,
  lossAmount,
}: Props) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      danger
      title="Ziyanla satış təsdiqi"
      message={`Bu satış ${fmtMoney(
        Math.abs(lossAmount),
      )} ziyan verəcək. Yenə də davam etmək istəyirsiniz?`}
      confirmText="Bəli, ziyanla sat"
    />
  );
}
