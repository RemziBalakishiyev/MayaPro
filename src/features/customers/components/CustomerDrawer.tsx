import { useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  HandCoins,
  MessageCircle,
  Phone,
  ShoppingCart,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fmtMoney, fmtDate } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { useSales } from "@/features/sales/queries";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import { useCustomerHistory } from "../queries";
import type { Customer, CustomerHistoryEntry } from "@/types";

interface Props {
  customer: Customer | null;
  onClose: () => void;
  onPay: (customer: Customer) => void;
}

function historyLabel(entry: CustomerHistoryEntry): string {
  if (entry.type === "initialDebt") return "İlkin borc";
  if (entry.type === "payment") {
    return entry.note ? `Ödəniş — ${entry.note}` : "Ödəniş";
  }
  return entry.note || "Satış";
}

export function CustomerDrawer({ customer, onClose, onPay }: Props) {
  const { data: allSales = [] } = useSales();
  const { data: historyAsc = [] } = useCustomerHistory(customer?.id);
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);

  const cusSales = useMemo(
    () =>
      customer
        ? allSales
            .filter((s) => s.customerId === customer.id)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        : [],
    [allSales, customer],
  );

  // UI: ən yenilər yuxarıda
  const history = useMemo(
    () => [...historyAsc].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [historyAsc],
  );

  const isDebtor = (customer?.remainingDebt ?? 0) > 0;
  const phoneDisplay = customer ? formatPhoneDisplay(customer.phone) : "";
  const status = isDebtor ? "Borclu" : "Ödənilib";

  return (
    <Drawer
      open={!!customer}
      onClose={onClose}
      title={
        customer ? (
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="truncate">{customer.name}</span>
            <Badge tone={status} className="shrink-0 text-xs">
              {status}
            </Badge>
          </span>
        ) : (
          ""
        )
      }
      footer={
        customer ? (
          <div className="flex gap-2 border-t border-stone-200 bg-white p-4">
            <Button
              className="min-w-0 flex-1"
              icon={<HandCoins size={16} />}
              onClick={() => onPay(customer)}
            >
              Ödəniş əlavə et
            </Button>
            {isDebtor && customer.phone ? (
              <a
                href={waLink(customer.phone, customer.remainingDebt, waTemplate)}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1"
              >
                <Button
                  className="w-full ring-emerald-300"
                  variant="secondary"
                  icon={<MessageCircle size={16} className="text-emerald-600" />}
                >
                  WhatsApp
                </Button>
              </a>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {customer && (
        <div className="space-y-6">
          {/* Qalıq borc — əsas siqnal */}
          <div
            className={cn(
              "rounded-2xl border p-4",
              isDebtor
                ? "border-red-100 bg-gradient-to-br from-red-50 to-white"
                : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
            )}
          >
            <p className="text-sm font-medium text-stone-500">Qalıq borc</p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tabular-nums tracking-tight",
                isDebtor ? "text-red-600" : "text-emerald-700",
              )}
            >
              {fmtMoney(customer.remainingDebt)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200/80 pt-3">
              <div>
                <p className="text-xs font-medium text-stone-400">Toplam borc</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-stone-800">
                  {fmtMoney(customer.totalDebt)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-stone-400">Ödənilən</p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-700">
                  {fmtMoney(customer.paidAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Əlaqə */}
          <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-stone-500 ring-1 ring-stone-200">
              <Phone size={16} />
            </span>
            {phoneDisplay ? (
              <a
                href={`tel:+${customer.phone.replace(/\D/g, "")}`}
                className="min-w-0 text-sm font-semibold tabular-nums text-stone-800 hover:text-emerald-700"
              >
                {phoneDisplay}
              </a>
            ) : (
              <span className="text-sm text-stone-400">Telefon yoxdur</span>
            )}
          </div>

          {/* Aldığı mallar */}
          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Aldığı mallar
              </h4>
              {cusSales.length > 0 && (
                <span className="text-xs tabular-nums text-stone-400">
                  {cusSales.length} alış
                </span>
              )}
            </div>
            {cusSales.length === 0 ? (
              <EmptyState icon={ShoppingCart} title="Nisyə alış yoxdur" />
            ) : (
              <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {cusSales.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 px-3.5 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <ArrowUpRight size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-stone-800">
                        {s.productName}{" "}
                        <span className="font-medium text-stone-400">
                          × {s.quantity}
                        </span>
                      </p>
                      <p className="text-xs text-stone-400">
                        {fmtDate(s.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-red-600">
                      +{fmtMoney(s.totalAmount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Tarixçə */}
          <section>
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-stone-500">
                Borc / ödəniş tarixçəsi
              </h4>
              {history.length > 0 && (
                <span className="text-xs tabular-nums text-stone-400">
                  {history.length} əməliyyat
                </span>
              )}
            </div>
            {history.length === 0 ? (
              <EmptyState icon={HandCoins} title="Tarixçə yoxdur" />
            ) : (
              <ul className="relative space-y-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                {history.map((h, i) => {
                  const isPay = h.type === "payment";
                  const isInitial = h.type === "initialDebt";
                  return (
                    <li
                      key={`${h.type}-${h.date}-${h.amount}-${i}`}
                      className={cn(
                        "relative flex items-center gap-3 px-3.5 py-3",
                        i > 0 && "border-t border-stone-100",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          isPay
                            ? "bg-emerald-50 text-emerald-600"
                            : isInitial
                              ? "bg-amber-50 text-amber-600"
                              : "bg-red-50 text-red-500",
                        )}
                      >
                        {isPay ? (
                          <ArrowDownLeft size={15} />
                        ) : isInitial ? (
                          <BookOpen size={15} />
                        ) : (
                          <ArrowUpRight size={15} />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {historyLabel(h)}
                        </p>
                        <p className="text-xs text-stone-400">
                          {fmtDate(h.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-bold tabular-nums",
                          isPay ? "text-emerald-700" : "text-red-600",
                        )}
                      >
                        {isPay ? "−" : "+"}
                        {fmtMoney(h.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
