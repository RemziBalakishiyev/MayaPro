import { useMemo } from "react";
import { HandCoins, MessageCircle, Phone, ShoppingCart } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { useSales } from "@/features/sales/queries";
import { waLink } from "../lib";
import { useCustomerPayments } from "../queries";
import type { Customer } from "@/types";

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onPay: (customer: Customer) => void;
}

interface HistoryRow {
  id: string;
  date: string;
  label: string;
  amount: number;
  kind: "debt" | "pay";
}

export function CustomerDrawer({ customer, onClose, onPay }: Props) {
  const { data: allSales = [] } = useSales();
  const { data: payments = [] } = useCustomerPayments(customer?.id);

  const cusSales = useMemo(
    () =>
      customer
        ? allSales
            .filter((s) => s.customerId === customer.id)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        : [],
    [allSales, customer],
  );

  const history = useMemo<HistoryRow[]>(() => {
    const debts: HistoryRow[] = cusSales.map((s) => ({
      id: s.id,
      date: s.createdAt,
      label: `${s.productName} × ${s.quantity}`,
      amount: s.totalAmount,
      kind: "debt",
    }));
    const pays: HistoryRow[] = payments.map((p) => ({
      id: p.id,
      date: p.date,
      label: p.note ? `Ödəniş — ${p.note}` : `Ödəniş (${p.method})`,
      amount: p.amount,
      kind: "pay",
    }));
    return [...debts, ...pays].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [cusSales, payments]);

  return (
    <Drawer
      open={!!customer}
      onClose={onClose}
      title={customer?.name ?? ""}
    >
      {customer && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Toplam borc" value={fmtMoney(customer.totalDebt)} />
            <StatCard
              label="Ödənilən"
              value={fmtMoney(customer.paidAmount)}
              tone="green"
            />
            <StatCard
              label="Qalıq"
              value={fmtMoney(customer.remainingDebt)}
              tone={customer.remainingDebt > 0 ? "red" : "green"}
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              icon={<HandCoins size={14} />}
              onClick={() => onPay(customer)}
            >
              Ödəniş əlavə et
            </Button>
            {customer.remainingDebt > 0 && (
              <a
                href={waLink(customer.phone, customer.remainingDebt)}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" variant="secondary">
                  <MessageCircle size={14} className="text-green-600" /> WhatsApp
                  xatırlatma
                </Button>
              </a>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-sm text-stone-600">
            <Phone size={13} /> {customer.phone || "—"}
          </p>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Aldığı mallar
            </h4>
            {cusSales.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Nisyə alış yoxdur" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {cusSales.map((s) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {s.productName} × {s.quantity}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {fmtDate(s.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-red-600">
                      +{fmtMoney(s.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
              Borc / ödəniş tarixçəsi
            </h4>
            {history.length === 0 ? (
              <EmptyState icon={HandCoins} title="Tarixçə yoxdur" />
            ) : (
              <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center gap-2 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {h.label}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {fmtDate(h.date)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        h.kind === "pay" ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {h.kind === "pay" ? "−" : "+"}
                      {fmtMoney(h.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
