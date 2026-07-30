import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Pencil, Receipt, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyValue } from "@/components/ui/EmptyValue";
import { Spinner } from "@/components/ui/Spinner";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney, fmtMoneySigned } from "@/lib/format";
import { formatPhoneDisplay } from "@/lib/phone";
import { useCan } from "@/features/auth/store";
import { useCustomers } from "@/features/customers/queries";
import { useEmployees } from "@/features/employees/queries";
import { saleBatchExpense, saleInvoiceNumber } from "../lib";
import { useSaleDetail } from "../queries";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";
import type { SaleDetail } from "@/types";

interface Props {
  saleId: string | null;
  onClose: () => void;
  /** "Düzəliş et" düyməsi — SaleEditDrawer-i açır (draweri özü bağlayır). */
  onEdit: (saleId: string) => void;
  /** "Sil" düyməsi — silmə təsdiqini açır. */
  onDelete: (sale: SaleDetail) => void;
}

const saleDateTime = (iso: string): string => {
  const date = fmtDate(iso, "dd.MM.yyyy");
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return date;
  return `${date} ${fmtDate(iso, "HH:mm")}`;
};

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-stone-400">
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

/** Satış jurnalı sətirindən açılan detal drawer — ProductForm kart üslubunda. */
export function SaleDetailDrawer({ saleId, onClose, onEdit, onDelete }: Props) {
  const canManage = useCan()("sales.manage");
  const { data: sale, isLoading, isError, error } = useSaleDetail(saleId);
  const { data: employees = [] } = useEmployees();
  const { data: customers = [] } = useCustomers();
  const { download: downloadInvoice, pendingId } = useInvoiceDownload();
  const { send: sendInvoiceWa, pendingId: waPendingId } = useInvoiceWhatsApp();
  const invoicePending = !!sale && pendingId === sale.id;
  const waPending = !!sale && waPendingId === sale.id;

  const matchedCustomer = sale?.customerId
    ? (customers.find((c) => c.id === sale.customerId) ?? null)
    : null;
  const customerPhone = matchedCustomer?.phone ?? "";
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

  const footer = sale ? (
    <div className="grid grid-cols-2 gap-2 border-t border-stone-200 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <Button
        variant="secondary"
        size="lg"
        className="w-full"
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
          "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold text-white transition-colors",
          "bg-[#25D366] hover:bg-[#1eba57] active:bg-[#15954a]",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        {waPending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <WhatsAppIcon size={18} />
        )}
        WhatsApp
      </button>

      {canManage && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            icon={<Pencil size={18} />}
            onClick={() => {
              onClose();
              onEdit(sale.id);
            }}
          >
            Düzəliş et
          </Button>
          <Button
            type="button"
            variant="danger"
            size="lg"
            className="w-full"
            icon={<Trash2 size={18} />}
            onClick={() => onDelete(sale)}
          >
            Sil
          </Button>
        </>
      )}
    </div>
  ) : undefined;

  return (
    <Drawer open={!!saleId} onClose={onClose} title="Satış detalı" footer={footer}>
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
        <div className="space-y-4">
          {/* Başlıq zolağı */}
          <div className="flex items-start justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-stone-900">
                {sale.productName}
              </p>
              {(sale.category || sale.isManual) && (
                <p className="mt-1 truncate text-sm text-stone-400">
                  {[sale.category, sale.isManual ? "Sərbəst" : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-extrabold tabular-nums text-stone-900">
                {fmtMoney(sale.totalAmount)}
              </p>
              <Badge tone={sale.paymentType} className="mt-1">
                {sale.paymentType}
              </Badge>
            </div>
          </div>

          {/* ① Hesab */}
          <Card title="① Hesab">
            <Row
              label={`Satış qiyməti × ${sale.quantity}`}
              value={fmtMoney(sale.salePrice)}
            />
            <Row label="Cəm" value={fmtMoney(sale.subtotal)} />
            {sale.discount > 0 && (
              <Row
                label="Endirim"
                value={
                  <span className="font-medium text-red-600">
                    −{fmtMoney(sale.discount)}
                  </span>
                }
              />
            )}
            <div className="border-t-2 border-stone-200 pt-2">
              <Row label="YEKUN" value={fmtMoney(sale.totalAmount)} strong />
            </div>

            <div className="mt-2 space-y-2 rounded-xl bg-stone-50 p-3.5">
              <Row
                label="Maya qiyməti (vahid)"
                value={
                  sale.purchasePricePerUnit != null ? (
                    fmtMoney(sale.purchasePricePerUnit)
                  ) : (
                    <EmptyValue />
                  )
                }
              />

              {sale.isManual && (sale.expenseItems?.length ?? 0) > 0 ? (
                <div>
                  <p className="mb-1 text-sm text-stone-500">Xərclər</p>
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
              ) : (
                <Row
                  label="Bu satışa düşən xərc"
                  value={
                    batchExpense != null ? (
                      fmtMoney(batchExpense)
                    ) : (
                      <EmptyValue />
                    )
                  }
                />
              )}

              <div className="flex items-baseline justify-between gap-3 border-t border-stone-200 pt-2">
                <span className="text-sm font-semibold text-stone-600">
                  QAZANC
                </span>
                <span
                  className={cn(
                    "text-xl font-bold tabular-nums",
                    sale.profit == null
                      ? "text-stone-400"
                      : sale.profit < 0
                        ? "text-red-600"
                        : "text-emerald-700",
                  )}
                >
                  {sale.profit == null ? "naməlum" : fmtMoneySigned(sale.profit)}
                </span>
              </div>
            </div>
          </Card>

          {/* ② Müştəri (yalnız customerId varsa) */}
          {sale.customerId && (
            <Card title="② Müştəri">
              {deletedCustomer ? (
                <p className="text-sm font-medium text-stone-400">
                  Silinmiş müştəri
                </p>
              ) : linkedCustomerName ? (
                <Link
                  to="/musteriler"
                  search={{ customerId: sale.customerId! }}
                  onClick={onClose}
                  className="text-base font-bold text-emerald-700 underline-offset-2 hover:underline"
                >
                  {linkedCustomerName}
                </Link>
              ) : (
                <p className="text-sm text-stone-400">—</p>
              )}

              {customerPhone.trim() && (
                <p className="text-sm text-stone-600">
                  {formatPhoneDisplay(customerPhone)}
                </p>
              )}

              {sale.paymentType === "Nisyə" && (
                <div className="mt-1 space-y-1.5 rounded-xl bg-orange-50 p-3">
                  <Row
                    label="Bu satışdan borc"
                    value={
                      <span className="font-bold text-orange-800">
                        {fmtMoney(sale.totalAmount)}
                      </span>
                    }
                  />
                  {matchedCustomer && (
                    <Row
                      label="Cari ümumi qalıq borc"
                      value={fmtMoney(matchedCustomer.remainingDebt)}
                    />
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ③ Məlumat */}
          <Card title="③ Məlumat">
            <Row label="Satıcı" value={seller} />
            <Row label="Tarix" value={saleDateTime(sale.createdAt)} />
            <Row
              label="Satış №"
              value={
                <span className="tabular-nums">
                  {saleInvoiceNumber(sale)}
                </span>
              }
            />
          </Card>
        </div>
      )}
    </Drawer>
  );
}
