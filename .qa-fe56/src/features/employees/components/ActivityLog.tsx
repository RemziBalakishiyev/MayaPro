import { useMemo, useState } from "react";
import {
  ShoppingCart,
  Tag,
  HandCoins,
  Receipt,
  Package,
  Lock,
  Truck,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { fmtDate } from "@/lib/format";
import { useAuthStore } from "@/features/auth/store";
import { useEmployees, useActivity } from "../queries";

const PAGE = 50;

/** Fəaliyyət növünə görə ikon və rəng. */
function iconFor(action: string): { Icon: LucideIcon; color: string } {
  if (action.includes("Endirim")) return { Icon: Tag, color: "text-amber-600 bg-amber-100" };
  if (action.includes("Satış")) return { Icon: ShoppingCart, color: "text-emerald-700 bg-emerald-100" };
  if (action.includes("Ödəniş")) return { Icon: HandCoins, color: "text-emerald-700 bg-emerald-100" };
  if (action.includes("Xərc")) return { Icon: Receipt, color: "text-rose-600 bg-rose-100" };
  if (action.includes("Stok") || action.includes("Mal")) return { Icon: Package, color: "text-indigo-600 bg-indigo-100" };
  if (action.includes("Gün sonu")) return { Icon: Lock, color: "text-stone-600 bg-stone-200" };
  if (action.includes("Təchizatçı")) return { Icon: Truck, color: "text-sky-600 bg-sky-100" };
  return { Icon: Clock, color: "text-stone-500 bg-stone-200" };
}

export function ActivityLog() {
  const { data: activity = [] } = useActivity();
  const { data: employees = [] } = useEmployees();
  const user = useAuthStore((s) => s.user);
  const [limit, setLimit] = useState(PAGE);

  const nameOf = useMemo(() => {
    const map = new Map(employees.map((e) => [e.id, e.name]));
    return (id: string) =>
      map.get(id) ?? (user && user.id === id ? user.name : "Naməlum");
  }, [employees, user]);

  if (activity.length === 0) {
    return <EmptyState icon={Clock} title="Fəaliyyət yoxdur" />;
  }

  const shown = activity.slice(0, limit);

  return (
    <div>
      <div className="divide-y divide-stone-100">
        {shown.map((a) => {
          const { Icon, color } = iconFor(a.action);
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${color}`}
              >
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-stone-800">
                  <b>{nameOf(a.employeeId)}</b> — {a.action}
                </p>
                <p className="truncate text-xs text-stone-400">{a.detail}</p>
              </div>
              <span className="shrink-0 text-xs text-stone-400">
                {fmtDate(a.date)}
              </span>
            </div>
          );
        })}
      </div>
      {limit < activity.length && (
        <div className="mt-3 flex justify-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setLimit((n) => n + PAGE)}
          >
            Daha çox göstər ({activity.length - limit})
          </Button>
        </div>
      )}
    </div>
  );
}
