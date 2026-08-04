import { create } from "zustand";
import { uid } from "@/lib/format";

export type ToastKind = "success" | "error" | "info";

export interface Toast {
  id: string;
  kind: ToastKind;
  msg: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, msg: string) => void;
  dismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 3000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, msg) => {
    const id = uid("toast");
    set((s) => ({ toasts: [...s.toasts, { id, kind, msg }] }));
    setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Komponentlərdən toast göstərmək üçün hook. */
export const useToast = () => {
  const push = useToastStore((s) => s.push);
  return {
    success: (msg: string) => push("success", msg),
    error: (msg: string) => push("error", msg),
    info: (msg: string) => push("info", msg),
  };
};
