import { History, Wallet } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useTenantPayments } from "../queries";
import type { Tenant } from "../types";

/** FE#183 (AC-15/TC-18/TC-19) — mağazanın ödəniş tarixçəsi, xronoloji siyahı. */
export function PaymentHistoryDrawer({
  tenant,
  onClose,
}: {
  tenant: Tenant | null;
  onClose: () => void;
}) {
  const { data: payments = [], isLoading, isError, refetch } = useTenantPayments(tenant?.id);

  return (
    <Drawer open={!!tenant} onClose={onClose} title={tenant ? `${tenant.name} — ödəniş tarixçəsi` : "Ödəniş tarixçəsi"}>
      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : isError ? (
        <InlineError
          message="Ödəniş tarixçəsi yüklənmədi"
          onRetry={() => void refetch()}
        />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Hələ ödəniş edilməyib"
          hint="Bu mağaza üçün ödəniş qeydə alınanda burada görünəcək."
          embedded
        />
      ) : (
        <ul className="space-y-2">
          {payments.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-control border border-stone-200 bg-white px-4 py-3"
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <History size={14} aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{fmtDate(p.paidAt)}</p>
                  <p className="text-xs text-stone-500">{p.periodMonths} ay</p>
                  {p.note && <p className="mt-0.5 text-xs text-stone-500">{p.note}</p>}
                </div>
              </div>
              <span className="font-bold tabular-nums text-emerald-700">{fmtMoney(p.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
