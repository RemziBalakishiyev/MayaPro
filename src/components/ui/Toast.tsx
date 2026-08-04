import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToastStore, type ToastKind } from "./toast-store";

const KIND_STYLE: Record<ToastKind, string> = {
  success: "bg-emerald-700",
  error: "bg-red-600",
  info: "bg-sky-700",
};

const KIND_ICON: Record<ToastKind, typeof Check> = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

/** Ekran oxuyucusu üçün növ adı — rəng yeganə siqnal olmasın (AC-10). */
const KIND_LABEL: Record<ToastKind, string> = {
  success: "Uğurlu",
  error: "Xəta",
  info: "Məlumat",
};

/** Sağ-aşağı küncdə toast siyahısı. main.tsx-də bir dəfə render olunur. */
export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      // FE#69 (F-39): bildirişlər ekran oxuyucusuna elan olunur.
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2"
    >
      {toasts.map((t) => {
        const Icon = KIND_ICON[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-control px-4 py-3 text-sm font-semibold text-white shadow-overlay",
              KIND_STYLE[t.kind],
            )}
          >
            <Icon size={16} aria-hidden className="shrink-0" />
            <span className="sr-only">{KIND_LABEL[t.kind]}: </span>
            {t.msg}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Bildirişi bağla"
              title="Bildirişi bağla"
              className="focus-ring ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-chip opacity-80 transition-opacity hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
