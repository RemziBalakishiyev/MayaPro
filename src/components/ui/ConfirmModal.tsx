import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Təsdiq əməliyyatı. `Promise` qaytarırsa modal YALNIZ uğurlu bitəndə
   * bağlanır; xəta halında açıq qalır və mesajı daxildə göstərir (F-43).
   * Sinxron funksiya qaytaran köhnə çağırışlar əvvəlki kimi işləyir.
   */
  onConfirm: () => void | Promise<unknown>;
  title?: ReactNode;
  message?: ReactNode;
  confirmText?: string;
  danger?: boolean;
  /** Xarici gözləmə vəziyyəti (məs. `mutation.isPending`). */
  isPending?: boolean;
  /** Xarici xəta mesajı — modal daxilində göstərilir. */
  error?: ReactNode;
}

/**
 * FE#69 — `ConfirmDialog` (təsdiq dialoqu). Mövcud `ConfirmModal` adı
 * saxlanılır, `ConfirmDialog` isə dizayn sistemindəki standart addır.
 *
 * Dağıdıcı əməliyyatlar HƏMİŞƏ mətn etiketli düymə ilə təsdiqlənir —
 * yalnız-ikon düymə ilə deyil (AC-15).
 */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Təsdiq et",
  danger,
  isPending,
  error,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    const result = onConfirm();
    // Sinxron çağırışlar üçün mövcud davranış: dərhal bağlan.
    if (!(result instanceof Promise)) {
      onClose();
      return;
    }
    // Promise qaytarıldıqda bağlama qərarı çağıran tərəfdədir (xəta halında
    // modal açıq qalsın deyə) — uğurda isə burada bağlanır.
    void result.then(
      () => onClose(),
      () => {
        /* xəta `error` propu ilə göstərilir */
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-stone-600">{message}</p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-chip bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 ring-1 ring-red-200"
        >
          <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          İmtina
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          loading={isPending}
          onClick={handleConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

/** Dizayn sistemindəki standart ad — eyni komponent. */
export const ConfirmDialog = ConfirmModal;
export type ConfirmDialogProps = ConfirmModalProps;
