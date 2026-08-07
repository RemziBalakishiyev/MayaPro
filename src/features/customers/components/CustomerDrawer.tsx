import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  HandCoins,
  Loader2,
  MessageCircle,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/toast-store";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { CopyablePhone } from "@/components/ui/CopyablePhone";
import { fmtMoney, fmtDate } from "@/lib/format";
import { toStoredPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { ApiError } from "@/lib/api-client";
import { useCan } from "@/features/auth/store";
import { useSales } from "@/features/sales/queries";
import { useInvoiceWhatsApp } from "@/features/sales/useInvoiceWhatsApp";
import { useSettingsStore } from "@/features/settings/store";
import { waLink } from "../lib";
import { useCustomerHistory, useDeleteCustomerCredit } from "../queries";
import {
  DEBT_HEADLINE_CLASS,
  DEBT_PANEL_CLASS,
  DEBT_TONE_LABEL,
  debtAgeDays,
  debtTone,
} from "./debt-presentation";
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
  const toast = useToast();
  const canManageCredit = useCan()("sales.manage");
  const deleteCredit = useDeleteCustomerCredit();
  const { send: sendInvoiceWa, pendingId: waPendingId } = useInvoiceWhatsApp();
  const { data: allSales = [] } = useSales();
  const { data: historyAsc = [] } = useCustomerHistory(customer?.id);
  const waTemplate = useSettingsStore((s) => s.whatsappTemplate);

  const [creditToDelete, setCreditToDelete] =
    useState<CustomerHistoryEntry | null>(null);

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
  // FE#73 (bənd 9) — 2 dərəcəli (Borclu/Ödənilib) ƏVƏZİNƏ 4 dərəcəli ton:
  // Ödənilib / Borclu / Gecikmiş borc / Kritik borc (`debt-presentation.ts`
  // — cədvəllə (`CustomersTable`) EYNİ qayda, HƏR borclu qırmızı görünməsin).
  const debtToneValue = customer
    ? debtTone(customer.remainingDebt, debtAgeDays(customer))
    : "none";
  const status = DEBT_TONE_LABEL[debtToneValue];

  const handleDeleteCredit = async () => {
    if (!customer || !creditToDelete?.saleId) return;
    try {
      await deleteCredit.mutateAsync({
        customerId: customer.id,
        saleId: creditToDelete.saleId,
      });
      toast.success("Nisyə borc silindi");
      setCreditToDelete(null);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.error(e.message || "Nisyə borc tapılmadı");
      } else if (e instanceof ApiError && e.status === 403) {
        toast.error(e.message || "Bu əməliyyat üçün icazəniz yoxdur");
      } else {
        toast.error(e instanceof Error ? e.message : "Nisyə borc silinmədi");
      }
    }
  };

  return (
    <>
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
                  href={waLink(
                    customer.phone,
                    customer.remainingDebt,
                    waTemplate,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1"
                >
                  <Button
                    className="w-full ring-emerald-300"
                    variant="secondary"
                    icon={
                      <MessageCircle size={16} className="text-emerald-600" />
                    }
                  >
                    WhatsApp
                  </Button>
                </a>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {(isExpanded) =>
        customer && (
          <div className="space-y-6">
            {/* Qalıq borc — əsas siqnal (FE#73: rəng 4 dərəcəli tondan gəlir,
                HƏR borclu eyni "qırmızı təhlükə" kimi görünmür). */}
            <div className={cn("rounded-card border p-4", DEBT_PANEL_CLASS[debtToneValue])}>
              <p className="text-sm font-medium text-stone-500">Qalıq borc</p>
              <p
                className={cn(
                  "mt-1 text-3xl font-bold tabular-nums tracking-tight",
                  DEBT_HEADLINE_CLASS[debtToneValue],
                )}
              >
                {fmtMoney(customer.remainingDebt)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200/80 pt-3">
                <div>
                  <p className="text-xs font-medium text-stone-400">
                    Toplam borc
                  </p>
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

            {/* Əlaqə — FE#73: standart kart üslubu (başlıq + `rounded-card`
                panel), digər bölmələrlə (Aldığı mallar / Tarixçə) eyni dil. */}
            <section>
              <h4 className="mb-2.5 text-xs font-bold uppercase tracking-wide text-stone-500">
                Əlaqə
              </h4>
              <div className="flex items-center gap-3 rounded-card border border-stone-200 bg-stone-50 px-3.5 py-3">
                {/* FE#156 — hit-slop patch əvəzinə paylaşılan `CopyablePhone`
                    primitivindən istifadə edirik (AC-3: mövcud primitivi
                    təkrarlama, istifadə et). */}
                {toStoredPhone(customer.phone) ? (
                  <CopyablePhone
                    phone={customer.phone}
                    className="text-sm font-semibold text-stone-800 underline-offset-2 hover:text-emerald-700 hover:underline"
                  />
                ) : (
                  <span className="text-sm text-stone-400">Telefon yoxdur</span>
                )}
              </div>
            </section>

            {/* Genişdə "Aldığı mallar" + "Tarixçə" yan-yana göstərilir. */}
            <div
              className={cn(
                "grid grid-cols-1 items-start gap-6",
                isExpanded && "lg:grid-cols-2",
              )}
            >
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
                <ul className="divide-y divide-stone-100 overflow-hidden rounded-card border border-stone-200 bg-white">
                  {cusSales.map((s) => {
                    const hasPhone = !!customer.phone.replace(/\D/g, "");
                    const waBusy = waPendingId === s.id;
                    return (
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
                        <button
                          type="button"
                          title={
                            hasPhone
                              ? "Qaiməni WhatsApp-la göndər"
                              : "Müştəri telefonu yoxdur"
                          }
                          aria-label="Qaiməni WhatsApp-la göndər"
                          onClick={() =>
                            void sendInvoiceWa(
                              s.id,
                              customer.phone,
                              s.createdAt,
                            )
                          }
                          disabled={!hasPhone || waBusy}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#25D366] transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                        >
                          {waBusy ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <WhatsAppIcon size={15} />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/*
              Borc / ödəniş tarixçəsi — FE#73 (bənd 6): PM-in tələb etdiyi
              "borc tarixçəsi" və "ödəniş tarixçəsi" bölmələri BURADA QƏSDƏN
              AYRI-AYRI SİYAHILARA PARÇALANMAYIB, mövcud vahid xronoloji
              tarixçə saxlanılıb. Səbəb: bir borc qeydi (ilkin borc/nisyə
              satış) və onu söndürən ödəniş(lər) vaxt oxunda bir-birinin
              davamıdır — ayrı siyahılara bölünsə, istifadəçi "bu borc
              ödənilibmi?" sualına cavab tapmaq üçün iki siyahı arasında əl
              ilə tarix müqayisə etməli olardı. Hər qeyd artıq növünə görə
              vizual fərqlənir (ikon + rəng + `paymentType` badge-i:
              ödəniş=yaşıl enma oxu, ilkin borc=kəhrəba kitab ikonu, nisyə
              satış=qırmızı qalxma oxu) — DS 9-cu qaydaya uyğun, rəng tək
              göstərici deyil.
            */}
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
                <ul className="relative space-y-0 overflow-hidden rounded-card border border-stone-200 bg-white">
                  {history.map((h, i) => {
                    const isPay = h.type === "payment";
                    const isInitial = h.type === "initialDebt";
                    const isSale = h.type === "sale";
                    // Yalnız nisyə satış borcu artırır — silmək / qırmızı işarə də ona xasdır
                    const isDebtRaising =
                      isInitial || (isSale && h.paymentType === "Nisyə");
                    const canDeleteSale =
                      canManageCredit &&
                      isSale &&
                      h.paymentType === "Nisyə" &&
                      !!h.saleId;
                    return (
                      <li
                        key={`${h.type}-${h.saleId ?? ""}-${h.date}-${h.amount}-${i}`}
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
                                : isDebtRaising
                                  ? "bg-red-50 text-red-500"
                                  : "bg-stone-50 text-stone-500",
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
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p className="min-w-0 truncate text-sm font-semibold text-stone-800">
                              {historyLabel(h)}
                            </p>
                            {isSale && h.paymentType && (
                              <Badge
                                tone={h.paymentType}
                                className="shrink-0 px-1.5 py-0.5 text-[10px]"
                              >
                                {h.paymentType}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-stone-400">
                            {fmtDate(h.date)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-bold tabular-nums",
                            isPay
                              ? "text-emerald-700"
                              : isDebtRaising
                                ? "text-red-600"
                                : "text-stone-500",
                          )}
                        >
                          {isPay ? "−" : isDebtRaising ? "+" : ""}
                          {fmtMoney(h.amount)}
                        </span>
                        {canDeleteSale && (
                          <button
                            type="button"
                            aria-label="Nisyə borcu sil"
                            title="Nisyə borcu sil"
                            onClick={() => setCreditToDelete(h)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            </div>
          </div>
        )
      }
      </Drawer>

      <ConfirmModal
        open={!!creditToDelete}
        onClose={() => setCreditToDelete(null)}
        onConfirm={() => void handleDeleteCredit()}
        title="Nisyə borcu sil"
        message={
          creditToDelete
            ? `${historyLabel(creditToDelete)} (${fmtMoney(creditToDelete.amount)}) silinəcək. Müştəri borcu azalacaq, stok geri qayıdacaq. Bu əməliyyat geri alına bilməz.`
            : ""
        }
        confirmText="Sil"
        danger
      />
    </>
  );
}
