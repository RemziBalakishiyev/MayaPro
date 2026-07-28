import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Spinner } from "@/components/ui/Spinner";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { useCustomers } from "@/features/customers/queries";
import { useEmployees } from "@/features/employees/queries";
import { saleBatchExpense } from "../lib";
import { useSaleDetail } from "../queries";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";

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
  const { data: customers = [] } = useCustomers();
  const { download: downloadInvoice, pendingId } = useInvoiceDownload();
  const { send: sendInvoiceWa, pendingId: waPendingId } = useInvoiceWhatsApp();
  const invoicePending = !!sale && pendingId === sale.id;
  const waPending = !!sale && waPendingId === sale.id;

  const customerPhone =
    sale?.customerId
      ? (customers.find((c) => c.id === sale.customerId)?.phone ?? "")
      : "";
  // Müştəri seçilmiş hər satışda (nağd/kart daxil) WhatsApp göndərmək olar
  const canWa = !!sale && !!sale.customerId && !!customerPhone.trim();

  const seller =
    sale?.soldByName ||
    employees.find((e) => e.id === sale?.employeeId)?.name ||
    "—";

  const batchExpense = sale ? saleBatchExpense(sale) : null;

  // Nisyədə müştəri məcburi olduğu üçün adının boş qayıtması → silinmiş müştəri
  const deletedCustomer =
    sale?.paymentType === "Nisyə" &&
    !(sale.customerName && sale.customerName.trim());
  const linkedCustomerName =
    sale?.customerId && sale.customerName?.trim() ? sale.customerName : null;

  return (
    <Drawer
      open={!!saleId}
      onClose={onClose}
      title="Satış detalı"
    >
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
                {(sale.category || sale.isManual) && (
                  <p className="mt-1 truncate text-sm text-stone-400">
                    {[sale.category, sale.isManual ? "Sərbəst" : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-sm tabular-nums text-stone-600">
                  {sale.quantity} × {fmtMoney(sale.salePrice)}
                </p>
              </div>
            </Section>

            <Section title="Hesab">
              <Row
                label="Maya qiyməti (vahid)"
                value={
                  sale.purchasePricePerUnit != null
                    ? fmtMoney(sale.purchasePricePerUnit)
                    : "—"
                }
              />
              <Row
                label="Bu satışa düşən xərc"
                value={batchExpense != null ? fmtMoney(batchExpense) : "—"}
              />

              {sale.isManual && (sale.expenseItems?.length ?? 0) > 0 && (
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <p className="mb-1.5 text-xs font-semibold text-stone-500">
                    Xərclər
                  </p>
                  <ul className="space-y-1">
                    {(sale.expenseItems ?? []).map((e, i) => (
                      <li
                        key={`${e.name}-${i}`}
                        className="flex justify-between gap-2 text-sm text-stone-700"
                      >
                        <span>{e.name}</span>
                        <span className="tabular-nums">
                          {fmtMoney(e.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Row label="Satış qiyməti" value={fmtMoney(sale.salePrice)} />

              {sale.discount > 0 && (
                <Row
                  label="Endirim"
                  value={
                    <span className="font-medium text-amber-600">
                      −{fmtMoney(sale.discount)}
                    </span>
                  }
                />
              )}

              <div className="border-t border-stone-100 pt-2">
                <Row label="Yekun" value={fmtMoney(sale.totalAmount)} strong />
              </div>

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
                      {fmtMoneySigned(sale.profit)}
                    </span>
                  )
                }
              />
            </Section>

            <Section title="Ödəniş">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={sale.paymentType}>{sale.paymentType}</Badge>
                {deletedCustomer ? (
                  <span className="text-sm font-medium text-stone-400">
                    Silinmiş müştəri
                  </span>
                ) : linkedCustomerName ? (
                  <Link
                    to="/musteriler"
                    search={{ customerId: sale.customerId! }}
                    onClick={onClose}
                    className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
                  >
                    {linkedCustomerName}
                  </Link>
                ) : null}
              </div>
            </Section>

            <Section title="Kim / nə vaxt">
              <Row label="Satıcı" value={seller} />
              <Row label="Tarix" value={saleDateTime(sale.createdAt)} />
            </Section>

            <div className="flex flex-col gap-2 border-t border-stone-100 pt-4">
              <Button
                variant="secondary"
                className="w-full justify-center"
                icon={
                  invoicePending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Receipt size={18} />
                  )
                }
                onClick={() => void downloadInvoice(sale.id)}
                disabled={invoicePending}
              >
                Qaimə (PDF)
              </Button>
              <button
                type="button"
                title={
                  !sale.customerId
                    ? "Bu satışda müştəri seçilməyib"
                    : !customerPhone.trim()
                      ? "Müştəri telefonu yoxdur"
                      : "WhatsApp-la göndər"
                }
                onClick={() =>
                  void sendInvoiceWa(sale.id, customerPhone, sale.createdAt)
                }
                disabled={!canWa || waPending}
                className={cn(
                  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-semibold text-white transition-colors",
                  "bg-[#25D366] hover:bg-[#1eba57] active:bg-[#15954a]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                {waPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <WhatsAppIcon size={18} />
                )}
                WhatsApp-la göndər
              </button>
            </div>
          </div>
        )}
      </Drawer>
  );
}
