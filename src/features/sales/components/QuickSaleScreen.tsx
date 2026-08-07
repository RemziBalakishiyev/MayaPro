import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  Coins,
  Loader2,
  Package,
  PackagePlus,
  Receipt,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { cn } from "@/lib/cn";
import { fmtMoney, fmtMoneySigned, todayISO } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { attrText, calcRealCost, firstAttrValue } from "@/features/products/lib";
import {
  ExpenseRows,
  incompleteExpenseIndexes,
  type ExpenseRowValue,
} from "@/components/ui/ExpenseRows";
import { useCustomers } from "@/features/customers/queries";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { CategoryField } from "@/features/categories/components/CategoryField";
import { mergeExpenseLines } from "@/features/products/lib";
import { netTotal, saleProfit, isLossSale } from "../lib";
import { useCreateSale } from "../queries";
import { useInvoiceDownload } from "../useInvoiceDownload";
import { useInvoiceWhatsApp } from "../useInvoiceWhatsApp";
import { SalesJournal } from "./SalesJournal";
import { QtyStepper } from "./QtyStepper";
import { LossConfirmModal } from "./LossConfirmModal";
import { CustomerSelectBlock } from "./CustomerSelectBlock";
import {
  PaymentConfirmModal,
  type PaymentConfirmPayload,
} from "./PaymentConfirmModal";
import type { Product } from "@/types";

export function QuickSaleScreen() {
  const toast = useToast();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();
  const { download: downloadInvoice, pendingId: invoicePendingId } =
    useInvoiceDownload();
  const { send: sendInvoiceWa, pendingId: waPendingId } = useInvoiceWhatsApp();

  // ——— Biznes state (dəyişməz) ———
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  // FE#25 — "SATIŞI TAMAMLA" birbaşa göndərmir, ödəniş təsdiq modalını açır.
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // ——— Sərbəst (manual) satış ———
  const [isManual, setIsManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualPurchase, setManualPurchase] = useState("");
  const [expenseRows, setExpenseRows] = useState<ExpenseRowValue[]>([]);
  const [expenseError, setExpenseError] = useState("");

  // ——— Yalnız təqdimat state ———
  const [search, setSearch] = useState("");
  const [newCusOpen, setNewCusOpen] = useState(false);
  const [newCusName, setNewCusName] = useState("");
  const [success, setSuccess] = useState<{
    id: string;
    name: string;
    amount: number;
    /** WhatsApp düyməsi üçün — nisyə deyilsə boş */
    customerPhone: string;
    /** wa mesajında istifadə olunan tarix (satış anı) */
    createdAt: string;
    isCredit: boolean;
    /** Qalıq borc (paidAmount &lt; yekun) — 0-dırsa satış tam ödənilib. */
    remainingAmount: number;
  } | null>(null);
  // Qaimə endirilərkən uğur ekranı öz-özünə bağlanmasın.
  const [holdSuccess, setHoldSuccess] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const product = products.find((p) => p.id === productId);
  // Detallar ekranı: katalog malı seçilib VƏ YA sərbəst satış rejimi
  const showDetails = !!product || isManual;

  // Mal dəyişəndə qiymət default = malın satış qiyməti
  useEffect(() => {
    if (product) setPrice(String(product.salePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // FE#71 (AC-2) — seçim ekranına qayıdanda axtarışa avtofokus, YALNIZ
  // təhlükəsiz olduqda: heç bir modal/drawer açıq olmamalı (klaviatura başqa
  // sahəni "oğurlamamalıdır") VƏ mobil ekranda (< 640px, `sm` breakpoint-i)
  // klaviatura özbaşına sıçramamalıdır. Barkod skaner davranışı bu şərtdən
  // TƏSİRLƏNMİR — skaner istifadəçi əl ilə (və ya sistem) fokusladıqdan sonra
  // işə düşür, bu effekt yalnız İLK avtomatik fokusu idarə edir.
  useEffect(() => {
    if (showDetails || success) return;
    if (newCusOpen || confirmOpen || paymentModalOpen) return;
    if (typeof window !== "undefined" && window.innerWidth < 640) return;
    searchRef.current?.focus();
  }, [showDetails, success, newCusOpen, confirmOpen, paymentModalOpen]);

  // Uğur ekranı 5 saniyə (qaimə düyməsinə çatmaq üçün) → təmiz seçimə qayıt
  useEffect(() => {
    if (!success || holdSuccess) return;
    const t = setTimeout(closeSuccess, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, holdSuccess]);

  // ——— Hesablamalar (mövcud pure funksiyalar) ———
  const q = Math.max(1, Number(qty) || 1);
  const sp = Number(price) || 0;
  const namedExpenses = useMemo(
    () => mergeExpenseLines(expenseRows),
    [expenseRows],
  );
  /**
   * Sərbəst satışda vahid alış qiyməti — TƏK mənbə: həm ekrandakı maya, həm də
   * payload-dakı `purchasePricePerUnit` bundan gəlir.
   * Boş sahə → null ("naməlum"); "0" → 0 (sıfır alış, naməlumla eyni deyil).
   */
  const manualPurchasePerUnit: number | null = useMemo(() => {
    const raw = manualPurchase.trim();
    if (raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [manualPurchase]);
  // Rəqəm olmayan ("1,5", "abc") və ya mənfi dəyər → satış bloklanır
  // (backend də mənfi alış qiymətinə 400 qaytarır).
  const manualPurchaseError: string | null =
    !isManual || manualPurchase.trim() === ""
      ? null
      : manualPurchasePerUnit == null
        ? "Rəqəm yazın (məs. 12.50)"
        : manualPurchasePerUnit < 0
          ? "Mənfi ola bilməz"
          : null;
  const manualPurchaseInvalid = manualPurchaseError != null;
  // Sərbəst: maya = alış + Σxərc/miqdar; alış boşdursa naməlum (xərc tək maya yaratmır)
  const realCost: number | null = isManual
    ? manualPurchasePerUnit == null
      ? null
      : calcRealCost(manualPurchasePerUnit, q, namedExpenses)
    : (product?.realCostPerUnit ?? 0);
  const net = netTotal(sp, q, 0);
  const profit: number | null =
    realCost == null ? null : saleProfit(sp, q, 0, realCost);
  const belowCost = realCost != null && isLossSale(sp, realCost);
  const notEnoughStock = !isManual && !!product && q > product.quantity;

  // Ödəniş növü/müştəri məcburiliyi FE#25-də ödəniş modalında həll olunur —
  // formada müştəri həmişə istəyə bağlıdır.
  const canSubmit =
    (isManual ? manualName.trim().length > 0 : !!product) &&
    sp > 0 &&
    !notEnoughStock &&
    !manualPurchaseInvalid;

  const reset = () => {
    setProductId("");
    setIsManual(false);
    setManualName("");
    setManualCategory("");
    setManualPurchase("");
    setExpenseRows([]);
    setExpenseError("");
    setQty("1");
    setPrice("");
    setCustomerId("");
    setNote("");
    setSearch("");
  };

  const closeSuccess = () => {
    reset();
    setHoldSuccess(false);
    setSuccess(null);
  };

  /** Ödəniş modalında "Təsdiqlə" — faktiki satış göndərişi (FE#25). */
  const complete = async (payment: PaymentConfirmPayload) => {
    if (!isManual && !product) return;
    if (isManual && incompleteExpenseIndexes(expenseRows).length > 0) {
      setExpenseError("Məbləği olan xərc sətirində ad yazılmalıdır");
      return;
    }
    const displayName = isManual ? manualName.trim() : product!.name;
    const category = isManual
      ? manualCategory.trim() || null
      : product!.category || null;
    try {
      const created = await createSale.mutateAsync({
        productId: isManual ? null : product!.id,
        productName: isManual ? displayName : undefined,
        category,
        isManual,
        quantity: q,
        salePrice: sp,
        discount: 0,
        paymentType: payment.paymentType,
        customerId: payment.customerId,
        paidAmount: payment.paidAmount,
        paidVia: payment.paidVia,
        costPerUnit: isManual ? realCost : undefined,
        // Katalog satışında alış qiyməti backend-də maldan snapshot alınır
        purchasePricePerUnit: isManual ? manualPurchasePerUnit : undefined,
        expenseItems: isManual && namedExpenses.length > 0 ? namedExpenses : undefined,
        note: note.trim() || undefined,
      });
      // Müştəri seçilibsə telefon götürülür (nağd/kartda da) → uğur ekranında
      // WhatsApp göndərmə düyməsi işə düşür.
      const cusPhone = payment.customerId
        ? (customers.find((c) => c.id === payment.customerId)?.phone ?? "")
        : "";
      setHoldSuccess(false);
      setPaymentModalOpen(false);
      setSuccess({
        id: created.id,
        name: displayName,
        amount: net,
        customerPhone: cusPhone,
        createdAt: created.createdAt ?? todayISO(),
        // WhatsApp düyməsinin şərti: müştəri seçilib + telefonu var
        // (nağd/kart satışda da müştəri olsa WhatsApp göndərilə bilər)
        isCredit: !!payment.customerId,
        remainingAmount: created.remainingAmount,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Satış alınmadı");
    }
  };

  const trySubmit = () => {
    if (isManual && incompleteExpenseIndexes(expenseRows).length > 0) {
      setExpenseError("Məbləği olan xərc sətirində ad yazılmalıdır");
      return;
    }
    if (profit != null && profit < 0) setConfirmOpen(true);
    else setPaymentModalOpen(true);
  };

  const selectProduct = (p: Product) => {
    if (p.quantity <= 0) return;
    setIsManual(false);
    setManualName("");
    setManualCategory("");
    setManualPurchase("");
    setExpenseRows([]);
    setProductId(p.id);
    setQty("1");
    setCustomerId("");
  };

  // Sərbəst satışa keçid: axtarılan mətn (varsa) ad sahəsinə hazır köçür
  const startManual = (name: string) => {
    setIsManual(true);
    setManualName(name);
    setManualCategory("");
    setManualPurchase("");
    setExpenseRows([]);
    setProductId("");
    setQty("1");
    setPrice("");
    setCustomerId("");
  };

  const changeProduct = () => {
    setProductId("");
    setIsManual(false);
    setManualName("");
    setManualCategory("");
    setManualPurchase("");
    setExpenseRows([]);
    setQty("1");
    setPrice("");
  };

  const step = (delta: number) => {
    const max = isManual ? Infinity : (product?.quantity ?? 1);
    setQty((prev) => String(Math.min(max, Math.max(1, (Number(prev) || 1) + delta))));
  };

  // Axtarış nəticəsi — yalnız yazılanda kart grid-i üçün
  const searchProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return products.filter((p) =>
      `${p.name} ${p.barcode} ${p.category} ${attrText(p)}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, products]);

  const openNewCustomer = (prefillName = "") => {
    setNewCusName(prefillName);
    setNewCusOpen(true);
  };

  // ——— Uğur ekranı ———
  if (success) {
    const invoicePending = invoicePendingId === success.id;
    const waPending = waPendingId === success.id;
    const canWa = success.isCredit && !!success.customerPhone.trim();
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <Check size={64} className="text-emerald-600" strokeWidth={3} />
        </div>
        <div role="status" aria-live="polite">
          <p className="text-2xl font-bold text-stone-900">Satış tamamlandı</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-700">
            {fmtMoney(success.amount)}
          </p>
          <p className="mt-2 text-base text-stone-500">{success.name}</p>
          {/* FE#25 (AC6) — qismən/ödənilməmiş satışda əlavə xəbərdarlıq sətri */}
          {success.remainingAmount > 0 && (
            <p className="mt-3 rounded-xl bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800 ring-1 ring-orange-200">
              Qalıq borc: {fmtMoney(success.remainingAmount)} — Nisyə
              Borclarda görünəcək
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Receipt size={16} />}
              loading={invoicePending}
              onClick={() => {
                setHoldSuccess(true);
                void downloadInvoice(success.id);
              }}
            >
              Qaimə çıxar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={closeSuccess}
            >
              Satış səhifəsinə qayıt
            </Button>
            <button
              type="button"
              title={
                !success.isCredit
                  ? "Bu satışda müştəri seçilməyib"
                  : !success.customerPhone.trim()
                    ? "Müştəri telefonu yoxdur"
                    : "WhatsApp-la göndər"
              }
              onClick={() => {
                setHoldSuccess(true);
                void sendInvoiceWa(
                  success.id,
                  success.customerPhone,
                  success.createdAt,
                );
              }}
              disabled={!canWa || waPending}
              className={cn(
                "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold text-white transition-colors",
                "bg-[#25D366] hover:bg-[#1eba57] active:bg-[#15954a]",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {waPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <WhatsAppIcon size={16} />
              )}
              WhatsApp-la göndər
            </button>
          </div>
          {/* Avtomatik qayıdış yalnız qaimə/WhatsApp gözlənilməyəndə işləyir;
              hər iki halda yuxarıdakı "Satış səhifəsinə qayıt" əl ilə çıxış verir. */}
          <p className="text-xs text-stone-400">
            {holdSuccess
              ? "Hazır olanda satış səhifəsinə qayıt."
              : "Bir neçə saniyəyə avtomatik satış səhifəsinə qayıdılacaq."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        showDetails && "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6",
      )}
    >
      {/* SOL: seçim və ya detallar */}
      <div className="pb-28 lg:pb-0">
        {/* FE#81 (AC-1/AC-2): Satış tam-ekran POS ekranıdır və `PageHeader`
            istifadə etmir (qəsdən istisna, bax docs/pages/sales-ui-refactor.md).
            Başlığın tipoqrafiyası və alt boşluğu isə `PageHeader` ilə
            EYNİLƏŞDİRİLDİ (`leading-tight` + `mb-6`) ki, səhifələr arasında
            başlıq xətti sürüşməsin. */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold leading-tight text-stone-900 lg:text-3xl">
            Satış
          </h1>
        </div>

        {!showDetails ? (
          /* ——— MAL SEÇİMİ ——— */
          <div>
            {/* FE#71 (AC-1) — mal/barkod axtarışı səhifənin ən dominant
                elementidir: ən böyük, ən yuxarıda, ən çox boşluqla vurğulanan.
                "Sərbəst satış" (AC-4) bilərəkdən kiçik/ikinci dərəcəli ghost
                düymədir, axtarışın altında. */}
            <div className="mb-5 rounded-3xl border-2 border-stone-100 bg-white p-3 shadow-card sm:p-4">
              <div className="relative">
                <Search
                  size={22}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 sm:left-5"
                />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mal adı və ya barkod — satış üçün"
                  aria-label="Mal adı və ya barkod — satış üçün"
                  className="h-16 w-full rounded-2xl border-2 border-stone-200 bg-stone-50 pl-12 pr-4 text-lg font-semibold text-stone-900 outline-none transition-colors placeholder:font-normal placeholder:text-stone-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 sm:h-20 sm:pl-14 sm:text-xl"
                />
              </div>
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => startManual("")}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100 active:scale-[0.98]"
                >
                  <PackagePlus size={16} />
                  Sərbəst satış
                </button>
              </div>
            </div>

            {search.trim() ? (
              /* ——— AXTARIŞ: mal kartları ——— */
              searchProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
                  <p className="text-base font-bold text-stone-600">
                    «{search.trim()}» tapılmadı
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Başqa ad yoxlayın və ya sərbəst satışla daxil edin.
                  </p>
                  <Button
                    size="lg"
                    className="mx-auto mt-4 justify-center"
                    icon={<PackagePlus size={20} />}
                    onClick={() => startManual(search.trim())}
                  >
                    «{search.trim()}» — Sərbəst satışla daxil et
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {searchProducts.map((p) => {
                    const out = p.quantity <= 0;
                    const low = p.quantity <= p.minStock;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectProduct(p)}
                        disabled={out}
                        className={cn(
                          "flex flex-col justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-card transition active:scale-[0.98]",
                          out
                            ? "cursor-not-allowed border-stone-200 opacity-60"
                            : "border-stone-200 hover:border-emerald-400 hover:shadow-md",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-base font-bold text-stone-900">
                            {p.name}
                          </p>
                          {firstAttrValue(p) && (
                            <p className="truncate text-xs text-stone-400">
                              {firstAttrValue(p)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <span className="text-xl font-bold tabular-nums text-emerald-700">
                            {fmtMoney(p.salePrice)}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                              out
                                ? "bg-red-100 text-red-700"
                                : low
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-stone-100 text-stone-500",
                            )}
                          >
                            {out ? "Bitib" : `${p.quantity} əd.`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              /* ——— BOŞ AXTARIŞ: satış jurnalı ——— */
              <SalesJournal />
            )}
          </div>
        ) : (
          /* ——— SATIŞ DETALLARI ——— */
          <div className="space-y-4">
            {isManual ? (
              /* Sərbəst satış — 3 kart */
              <>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                    <PackagePlus size={14} /> Sərbəst satış
                  </span>
                  <button
                    type="button"
                    onClick={changeProduct}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 active:bg-stone-100"
                  >
                    <ArrowLeft size={16} /> Dəyiş
                  </button>
                </div>

                <SaleSection
                  icon={Package}
                  title="Mal haqqında"
                  desc="Ad və kateqoriya"
                >
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-stone-700">
                      Mal adı <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      autoFocus
                      placeholder="Mal adı (məcburi)"
                      className="h-14 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg font-bold text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-stone-700">
                      Kateqoriya{" "}
                      <span className="font-normal text-stone-400">
                        (istəyə bağlı)
                      </span>
                    </p>
                    <CategoryField
                      value={manualCategory}
                      onChange={setManualCategory}
                    />
                  </div>
                </SaleSection>

                <SaleSection
                  icon={Coins}
                  title="Qiymət və say"
                  desc="Alış, satış və miqdar"
                >
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div>
                      <label
                        htmlFor="manual-purchase"
                        className="mb-1.5 block text-sm font-medium text-stone-700"
                      >
                        Alış qiyməti
                      </label>
                      <input
                        id="manual-purchase"
                        value={manualPurchase}
                        onChange={(e) => setManualPurchase(e.target.value)}
                        inputMode="decimal"
                        placeholder="—"
                        aria-invalid={manualPurchaseInvalid || undefined}
                        aria-describedby="manual-purchase-hint"
                        className={cn(
                          "h-12 w-full rounded-xl border bg-white px-2 text-base font-bold tabular-nums outline-none focus:ring-4 sm:px-3",
                          manualPurchaseInvalid
                            ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-500/20"
                            : "border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500/20",
                        )}
                      />
                      <p
                        id="manual-purchase-hint"
                        className={cn(
                          "mt-1 text-xs",
                          manualPurchaseInvalid
                            ? "font-semibold text-red-600"
                            : "text-stone-500",
                        )}
                      >
                        {manualPurchaseError ?? "aldığın qiymət"}
                      </p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-stone-700">
                        Satış qiyməti <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        inputMode="decimal"
                        className={cn(
                          "h-12 w-full rounded-xl border bg-white px-2 text-base font-bold tabular-nums outline-none focus:ring-4 sm:px-3",
                          belowCost
                            ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-500/20"
                            : "border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500/20",
                        )}
                      />
                      <p className="mt-1 text-xs text-stone-500">satdığın qiymət</p>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-stone-700">
                        Miqdar
                      </label>
                      <QtyStepper
                        value={qty}
                        onChange={setQty}
                        onStep={step}
                        className="max-w-none"
                      />
                      <p className="mt-1 text-xs text-stone-500">neçə ədəd</p>
                    </div>
                  </div>
                  {realCost != null && (
                    <p className="text-xs font-semibold text-stone-500">
                      Maya (1 əd.):{" "}
                      <span className="tabular-nums text-stone-800">
                        {fmtMoney(realCost)}
                      </span>
                    </p>
                  )}
                </SaleSection>

                <SaleSection
                  icon={ClipboardList}
                  title="Xərc və müştəri"
                  desc="Partiya xərcləri və müştəri (istəyə bağlı)"
                >
                  <ExpenseRows
                    key={isManual ? "manual" : "off"}
                    value={expenseRows}
                    error={expenseError}
                    onChange={(rows) => {
                      setExpenseError("");
                      setExpenseRows(rows);
                    }}
                  />
                  <CustomerSelectBlock
                    customers={customers}
                    customerId={customerId}
                    setCustomerId={setCustomerId}
                    onNewCustomer={openNewCustomer}
                  />
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Qeyd (istəyə bağlı)"
                    className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                  />
                </SaleSection>
              </>
            ) : (
              /* Katalog malı — seçim + yığcam stepper */
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg font-bold text-stone-900">
                      {product!.name}
                    </p>
                    <p className="text-sm text-stone-500">
                      {fmtMoney(product!.salePrice)} · stok: {product!.quantity}{" "}
                      əd.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={changeProduct}
                    className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-base font-semibold text-stone-700 ring-1 ring-stone-300 active:bg-stone-100"
                  >
                    <ArrowLeft size={18} /> Dəyiş
                  </button>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-600">Say</p>
                  <QtyStepper
                    value={qty}
                    onChange={setQty}
                    onStep={step}
                    max={product?.quantity ?? Infinity}
                    size="lg"
                  />
                  {notEnoughStock && product && (
                    <p className="mt-1.5 text-sm font-semibold text-red-600">
                      Stokda yalnız {product.quantity} əd. var.
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-600">
                    Qiymət (1 əd.)
                  </p>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className={cn(
                      "h-14 w-full rounded-xl border bg-white px-4 text-xl font-bold tabular-nums outline-none focus:ring-4",
                      belowCost
                        ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-500/20"
                        : "border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500/20",
                    )}
                  />
                </div>

                <CustomerSelectBlock
                  customers={customers}
                  customerId={customerId}
                  setCustomerId={setCustomerId}
                  onNewCustomer={openNewCustomer}
                />

                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Qeyd (istəyə bağlı)"
                  className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                />
              </>
            )}

            {belowCost && realCost != null && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3.5 text-base font-bold text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={22} className="shrink-0" />
                Bu qiymətə satsan ziyana düşürsən! Minimum: {fmtMoney(realCost)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SAĞ (desktop): satış cəmi — yalnız detallarda */}
      {showDetails && (
        <div className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
            <TotalContent
              net={net}
              realCost={realCost}
              profit={profit}
              canSubmit={canSubmit}
              pending={createSale.isPending}
              onSubmit={trySubmit}
            />
          </div>
        </div>
      )}

      {/* MOBİL: sabit aşağı cəmi paneli (yalnız detallarda) */}
      {showDetails && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-stone-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <TotalContent
            net={net}
            realCost={realCost}
            profit={profit}
            canSubmit={canSubmit}
            pending={createSale.isPending}
            onSubmit={trySubmit}
          />
        </div>
      )}

      {/* FE#25 — "SATIŞI TAMAMLA"dan sonra açılan kassa üslubu ödəniş modalı */}
      <PaymentConfirmModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        net={net}
        pending={createSale.isPending}
        customers={customers}
        customerId={customerId}
        setCustomerId={setCustomerId}
        onNewCustomer={openNewCustomer}
        onConfirm={(payload) => void complete(payload)}
      />

      <NewCustomerModal
        open={newCusOpen}
        onClose={() => {
          setNewCusOpen(false);
          setNewCusName("");
        }}
        initialName={newCusName}
        onCreated={(customer) => setCustomerId(customer.id)}
      />
      <LossConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => setPaymentModalOpen(true)}
        lossAmount={profit ?? 0}
      />
    </div>
  );
}

/** ProductForm üslublu bölmə kartı. */
function SaleSection({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">{title}</h3>
          <p className="text-xs text-stone-500">{desc}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}


/** Cəmi + maya + qazanc + "Satışı tamamla". */
function TotalContent({
  net,
  realCost,
  profit,
  canSubmit,
  pending,
  onSubmit,
}: {
  net: number;
  realCost: number | null;
  profit: number | null;
  canSubmit: boolean;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="mb-3 space-y-1.5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Cəmi
          </p>
          <p className="text-3xl font-bold tabular-nums text-stone-900">
            {fmtMoney(net)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-stone-500">Maya</span>
          <span className="font-semibold tabular-nums text-stone-700">
            {realCost == null ? "naməlum" : fmtMoney(realCost)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-stone-500">Qazanc</span>
          {profit == null ? (
            <span className="font-bold tabular-nums text-stone-400">naməlum</span>
          ) : (
            <span
              className={cn(
                "font-bold tabular-nums",
                profit < 0 ? "text-red-600" : "text-emerald-700",
              )}
            >
              {fmtMoneySigned(profit)}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || pending}
        className="flex h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-lg font-bold text-white transition active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check size={22} strokeWidth={3} /> SATIŞI TAMAMLA
      </button>
    </div>
  );
}
