import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useEmployees } from "@/features/employees/queries";
import { useSaleDetail } from "../queries";

interface Props {
  saleId: string | null;
  onClose: () => void;
}

const saleDateTime = (iso: string): string => {
  const date = fmtDate(iso, "dd.MM.yyyy");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return date;
  return `${date} ${fmtDate(iso, "HH:mm")}`;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h4 className="text-xs font-bold uppercase tracking-wide text-stone-400">
        {title}
      </h4>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-stone-500">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums text-stone-800",
          strong ? "text-lg font-bold text-stone-900" : "text-sm font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Satış jurnalı sətirindən açılan detal drawer. */
export function SaleDetailDrawer({ saleId, onClose }: Props) {
  const { data: sale, isLoading, isError, error } = useSaleDetail(saleId);
  const { data: employees = [] } = useEmployees();

  const seller =
    sale?.soldByName ||
    employees.find((e) => e.id === sale?.employeeId)?.name ||
    "—";

  const costTotal =
    sale?.costPerUnit != null ? sale.costPerUnit * sale.quantity : null;

  return (
    <Drawer open={!!saleId} onClose={onClose} title="Satış detalı">
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <p className="py-8 text-center text-sm text-red-600">
          {error instanceof Error ? error.message : "Satış yüklənmədi"}
        </p>
      )}

      {sale && (
        <div className="space-y-6">
          <Section title="Mal">
            <div>
              <p className="text-base font-bold text-stone-900">
                {sale.productName}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {sale.category ? (
                  <span className="text-sm text-stone-400">{sale.category}</span>
                ) : null}
                {sale.isManual && (
                  <Badge tone="Sərbəst" className="px-1.5 py-0 text-[10px]">
                    Sərbəst
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-sm tabular-nums text-stone-600">
                {sale.quantity} × {fmtMoney(sale.salePrice)}
              </p>
            </div>
          </Section>

          <Section title="Hesab">
            <Row label="Cəm" value={fmtMoney(sale.subtotal)} />
            {sale.discount > 0 && (
              <Row label="Endirim" value={fmtMoney(sale.discount)} />
            )}
            <Row label="YEKUN" value={fmtMoney(sale.totalAmount)} strong />

            <div className="border-t border-stone-100 pt-2">
              <Row
                label="Maya (1 əd.)"
                value={
                  sale.costPerUnit != null ? fmtMoney(sale.costPerUnit) : "—"
                }
              />
              <Row
                label="Maya (ümumi)"
                value={costTotal != null ? fmtMoney(costTotal) : "—"}
              />
            </div>

            {sale.isManual && (sale.expenseItems?.length ?? 0) > 0 && (
              <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                <p className="mb-1.5 text-xs font-semibold text-stone-500">
                  Xərclər
                </p>
                <ul className="space-y-1">
                  {sale.expenseItems!.map((e, i) => (
                    <li
                      key={`${e.name}-${i}`}
                      className="flex justify-between gap-2 text-sm text-stone-700"
                    >
                      <span>{e.name}</span>
                      <span className="tabular-nums">{fmtMoney(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Row
              label="Qazanc"
              value={
                sale.profit == null ? (
                  <span className="font-medium text-stone-400">naməlum</span>
                ) : (
                  <span
                    className={cn(
                      "font-semibold",
                      sale.profit < 0 ? "text-red-600" : "text-emerald-700",
                    )}
                  >
                    {sale.profit >= 0 ? "+" : ""}
                    {fmtMoney(sale.profit)}
                  </span>
                )
              }
            />
          </Section>

          <Section title="Ödəniş">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={sale.paymentType}>{sale.paymentType}</Badge>
              {sale.paymentType === "Nisyə" && sale.customerId && (
                <Link
                  to="/borclar"
                  search={{ customerId: sale.customerId }}
                  onClick={onClose}
                  className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
                >
                  {sale.customerName || "Müştəri"}
                </Link>
              )}
            </div>
          </Section>

          <Section title="Kim / nə vaxt">
            <Row label="Satıcı" value={seller} />
            <Row label="Tarix" value={saleDateTime(sale.createdAt)} />
          </Section>
        </div>
      )}
    </Drawer>
  );
}
