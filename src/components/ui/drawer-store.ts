import { create } from "zustand";

interface DrawerExpandState {
  /** Bütün drawer-lər üçün ümumi "genişləndirilmiş" seçimi. */
  expanded: boolean;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
}

/**
 * Baza `Drawer` komponentinin genişlət/daralt vəziyyəti — hər drawer növü
 * üçün ayrıca deyil, ÜMUMİ bir seçimdir: istifadəçi bir drawer-i geniş açsa,
 * bağlayıb başqa bir drawer açanda o da geniş açılır. Sessiya daxilində
 * yadda qalır (səhifə yenilənənə qədər) — qəsdən localStorage-a yazılmır.
 */
export const useDrawerExpandStore = create<DrawerExpandState>((set) => ({
  expanded: false,
  toggle: () => set((s) => ({ expanded: !s.expanded })),
  setExpanded: (expanded) => set({ expanded }),
}));
