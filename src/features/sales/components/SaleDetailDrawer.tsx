import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Drawer } from "@/components/ui/Drawer";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/toast-store";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { fmtDate, fmtMoney } from "@/lib/format";
import { useCan } from "@/features/auth/store";
import { useEmployees } from "@/features/employees/queries";
import { useDeleteSale, useSaleDetail } from "../queries";
import { SaleEditDrawer } from "./SaleEditDrawer";

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
  const toast = useToast();
  const canManage = useCan()("sales.manage");
  const { data: sale, isLoading, isError, error } = useSaleDetail(saleId);
  const { data: employees = [] } = useEmployees();
  const deleteSale = useDeleteSale();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const seller =
    sale?.soldByName ||
    employees.find((e) => e.id === sale?.employeeId)?.name ||
    "—";

  const costTotal =
    sale?.costPerUnit != null ? sale.costPerUnit * sale.quantity : null;

  const deletedCustomer =
    sale?.paymentType === "Nisyə" &&
    !(sale.customerName && sale.customerName.trim());

  const handleDelete = async () => {
    if (!sale) return;
    try {
      await deleteSale.mutateAsync(sale.id);
      toast.success("Satış silindi");
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error(e.message || "Gün bağlanıb");
      } else {
        toast.error(e instanceof Error ? e.message : "Satış silinmədi");
      }
    }
  };

  return (
    <>
      <Drawer
        open={!!saleId && !editOpen}
        onClose={onClose}
        title="Satış detalı"
        footer={
          sale && canManage ? (
            <div className="flex gap-2 border-t border-stone-200 bg-white px-5 py-4">
              <Button
                variant="secondary"
                className="flex-1 justify-center"
                icon={<Pencil size={16} />}
                onClick={() => setEditOpen(true)}
              >
                Düzəliş et
              </Button>
              <Button
                variant="danger"
                className="flex-1 justify-center"
                icon={<Trash2 size={16} />}
                onClick={() => setConfirmDelete(true)}
              >
                Sil
              </Button>
            </div>
          ) : undefined
        }
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
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {sale.category ? (
                    <span className="text-sm text-stone-400">
                      {sale.category}
                    </span>
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
                    sale.costPerUnit != null
                      ? fmtMoney(sale.costPerUnit)
                      : "—"
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
                        <span className="tabular-nums">
                          {fmtMoney(e.amount)}
                        </span>
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
                {sale.paymentType === "Nisyə" &&
                  (deletedCustomer ? (
                    <span className="text-sm font-medium text-stone-400">
                      Silinmiş müştəri
                    </span>
                  ) : sale.customerId ? (
                    <Link
                      to="/borclar"
                      search={{ customerId: sale.customerId }}
                      onClick={onClose}
                      className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
                    >
                      {sale.customerName || "Müştəri"}
                    </Link>
                  ) : null)}
              </div>
            </Section>

            <Section title="Kim / nə vaxt">
              <Row label="Satıcı" value={seller} />
              <Row label="Tarix" value={saleDateTime(sale.createdAt)} />
            </Section>
          </div>
        )}
      </Drawer>

      <SaleEditDrawer
        saleId={editOpen ? saleId : null}
        onClose={() => setEditOpen(false)}
        onSaved={onClose}
      />

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
        title="Satışı sil"
        message="Stok geri qayıdacaq, nisyədirsə borc azalacaq"
        confirmText="Sil"
        danger
      />
    </>
  );
}
