import { useEffect, useState } from "react";
import { HandCoins, MinusCircle, Trash2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/toast-store";
import { useCan } from "@/features/auth/store";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useDeleteSalaryEntry, useSalaryEntries } from "../queries";
import { SalaryMonthSwitcher } from "./SalaryMonthSwitcher";
import type { EmployeeSalarySummary, SalaryEntry } from "@/types";

interface Props {
  employee: EmployeeSalarySummary | null;
  /** Səhifədə seçilmiş ay — draver açılanda başlanğıc dəyər kimi istifadə olunur. */
  month: string;
  onClose: () => void;
}

/** Maaş tarixçəsi draveri — ayın sətirləri xronoloji, ay dəyişmə, silmə (icazəyə görə). */
export function SalaryHistoryDrawer({ employee, month, onClose }: Props) {
  const toast = useToast();
  const canDelete = useCan()("salary.delete");
  const deleteMut = useDeleteSalaryEntry();
  const [drawerMonth, setDrawerMonth] = useState(month);
  const [deleteFor, setDeleteFor] = useState<SalaryEntry | null>(null);

  useEffect(() => {
    if (employee) setDrawerMonth(month);
  }, [employee, month]);

  const { data: entries = [], isLoading } = useSalaryEntries(
    employee?.userId ?? "",
    drawerMonth,
    !!employee,
  );

  const handleDelete = async () => {
    if (!deleteFor || !employee) return;
    try {
      await deleteMut.mutateAsync({ employeeId: employee.userId, entryId: deleteFor.id });
      toast.success("Maaş əməliyyatı silindi");
      setDeleteFor(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Silinmədi");
    }
  };

  return (
    <Drawer
      open={!!employee}
      onClose={onClose}
      title={employee ? `${employee.fullName} — Tarixçə` : "Tarixçə"}
    >
      {employee && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <SalaryMonthSwitcher month={drawerMonth} onChange={setDrawerMonth} size="sm" />
          </div>

          {isLoading ? (
            <Spinner />
          ) : entries.length === 0 ? (
            <EmptyState title="Bu ayda qeyd yoxdur" hint="Ödəniş və ya tutulma yazıldıqda burada görünəcək." />
          ) : (
            <div className="divide-y divide-stone-100">
              {entries.map((e) => {
                const isPayment = e.type === "payment";
                return (
                  <div key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div
                      className={
                        isPayment
                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-500"
                      }
                    >
                      {isPayment ? <HandCoins size={15} /> : <MinusCircle size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-stone-800">
                        {isPayment ? "Ödəniş" : "Tutulma"}
                      </p>
                      {e.note && (
                        <p className="truncate text-xs text-stone-400">{e.note}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={
                          isPayment
                            ? "text-sm font-bold tabular-nums text-emerald-700"
                            : "text-sm font-bold tabular-nums text-stone-500"
                        }
                      >
                        {isPayment ? "−" : ""}
                        {fmtMoney(e.amount)}
                      </p>
                      <p className="text-xs text-stone-400">{fmtDate(e.date)}</p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        aria-label="Sil"
                        onClick={() => setDeleteFor(e)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={() => void handleDelete()}
        title="Maaş əməliyyatını sil"
        message="Bu qeyd silinəcək. Bu əməliyyat geri alına bilməz."
        confirmText="Sil"
        danger
      />
    </Drawer>
  );
}
