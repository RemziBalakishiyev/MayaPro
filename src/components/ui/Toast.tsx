import { AlertTriangle, Check, Info, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToastStore, type ToastKind } from "./toast-store";

const KIND_STYLE: Record<ToastKind, string> = {
  success: "bg-emerald-700",
  error: "bg-red-600",
  info: "bg-sky-600",
};

const KIND_ICON: Record<ToastKind, typeof Check> = {
  success: Check,
  error: AlertTriangle,
  info: Info,
};

/** Sağ-aşağı küncdə toast siyahısı. main.tsx-də bir dəfə render olunur. */
export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = KIND_ICON[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg",
              KIND_STYLE[t.kind],
            )}
          >
            <Icon size={16} />
            {t.msg}
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
