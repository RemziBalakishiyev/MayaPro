import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  Coins,
  CreditCard,
  HandCoins,
  Package,
  PackagePlus,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
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
import { SalesJournal } from "./SalesJournal";
import { QtyStepper } from "./QtyStepper";
import { LossConfirmModal } from "./LossConfirmModal";
import type { Customer, PaymentType, Product } from "@/types";

const PAY_TYPES: {
  key: PaymentType;
  label: string;
  Icon: typeof Wallet;
  on: string;
  off: string;
}[] = [
  {
    key: "Nağd",
    label: "Nağd",
    Icon: Wallet,
    on: "border-emerald-600 bg-emerald-600 text-white",
    off: "border-stone-200 bg-white text-stone-600",
  },
  {
    key: "Kart",
    label: "Kart",
    Icon: CreditCard,
    on: "border-indigo-600 bg-indigo-600 text-white",
    off: "border-stone-200 bg-white text-stone-600",
  },
  {
    key: "Nisyə",
    label: "Nisyə",
    Icon: HandCoins,
    on: "border-amber-500 bg-amber-500 text-white",
    off: "border-stone-200 bg-white text-stone-600",
  },
];

export function QuickSaleScreen() {
  const toast = useToast();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();

  // ——— Biznes state (dəyişməz) ———
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [payType, setPayType] = useState<PaymentType>("Nağd");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const [success, setSuccess] = useState<{ name: string; amount: number } | null>(
    null,
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const product = products.find((p) => p.id === productId);
  // Detallar ekranı: katalog malı seçilib VƏ YA sərbəst satış rejimi
  const showDetails = !!product || isManual;

  // Mal dəyişəndə qiymət default = malın satış qiyməti
  useEffect(() => {
    if (product) setPrice(String(product.salePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Seçim ekranına qayıdanda axtarışa fokus
  useEffect(() => {
    if (!showDetails && !success) searchRef.current?.focus();
  }, [showDetails, success]);

  // Uğur ekranı 2 saniyə → təmiz seçimə qayıt
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      reset();
      setSuccess(null);
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  // ——— Hesablamalar (mövcud pure funksiyalar) ———
  const q = Math.max(1, Number(qty) || 1);
  const sp = Number(price) || 0;
  const disc = Number(discount) || 0;
  // Sərbəst: maya = alış + Σxərc/miqdar; alış boşdursa naməlum (xərc tək maya yaratmır)
  const namedExpenses = useMemo(
    () => mergeExpenseLines(expenseRows),
    [expenseRows],
  );
  const realCost: number | null = isManual
    ? manualPurchase.trim() === ""
      ? null
      : calcRealCost(Number(manualPurchase) || 0, q, namedExpenses)
    : (product?.realCostPerUnit ?? 0);
  const net = netTotal(sp, q, disc);
  const profit: number | null =
    realCost == null ? null : saleProfit(sp, q, disc, realCost);
  const belowCost = realCost != null && isLossSale(sp, realCost);
  const notEnoughStock = !isManual && !!product && q > product.quantity;

  const canSubmit =
    (isManual ? manualName.trim().length > 0 : !!product) &&
    sp > 0 &&
    !notEnoughStock &&
    (payType !== "Nisyə" || !!customerId);

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
    setDiscount("");
    setPayType("Nağd");
    setCustomerId("");
    setNote("");
    setSearch("");
  };

  const complete = async () => {
    if (!isManual && !product) return;
    if (isManual && incompleteExpenseIndexes(expenseRows).length > 0) {
      setExpenseError("Məbləği olan xərc sətirində ad yazılmalıdır");
      return;
    }
    const displayName = isManual ? manualName.trim() : product!.name;
    const category = isManual
      ? manualCategory.trim() || null
      : product!.category || null;
    const captured = { name: displayName, amount: net };
    try {
      await createSale.mutateAsync({
        productId: isManual ? null : product!.id,
        productName: isManual ? displayName : undefined,
        category,
        isManual,
        quantity: q,
        salePrice: sp,
        discount: disc,
        paymentType: payType,
        customerId: payType === "Nisyə" ? customerId : null,
        costPerUnit: isManual ? realCost : undefined,
        note: note.trim() || undefined,
      });
      setSuccess(captured);
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
    else complete();
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
    setDiscount("");
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
    setDiscount("");
    setPayType("Nağd");
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
    setDiscount("");
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
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <Check size={64} className="text-emerald-600" strokeWidth={3} />
        </div>
        <div>
          <p className="text-2xl font-bold text-stone-900">Satış tamamlandı</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-emerald-700">
            {fmtMoney(success.amount)}
          </p>
          <p className="mt-2 text-base text-stone-500">{success.name}</p>
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-stone-900 lg:text-3xl">Satış</h1>
        </div>

        {!showDetails ? (
          /* ——— MAL SEÇİMİ ——— */
          <div>
            <div className="mb-5 flex gap-2.5 rounded-2xl bg-stone-50/80 p-1.5 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-emerald-500/40">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={20}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  placeholder="Mal adı və ya barkod..."
                  className="h-11 w-full rounded-xl border-0 bg-transparent pl-11 pr-3 text-base text-stone-900 outline-none placeholder:text-stone-400"
                />
              </div>
              <button
                type="button"
                onClick={() => startManual("")}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-emerald-700 px-3.5 text-sm font-bold text-white transition active:scale-[0.98] active:bg-emerald-800 sm:px-4"
              >
                <PackagePlus size={20} />
                <span className="hidden sm:inline">Sərbəst satış</span>
              </button>
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
                      <label className="mb-1.5 block text-sm font-medium text-stone-700">
                        Alış qiyməti
                      </label>
                      <input
                        value={manualPurchase}
                        onChange={(e) => setManualPurchase(e.target.value)}
                        inputMode="decimal"
                        placeholder="—"
                        className="h-12 w-full rounded-xl border border-stone-300 bg-white px-2 text-base font-bold tabular-nums text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 sm:px-3"
                      />
                      <p className="mt-1 text-xs text-stone-500">aldığın qiymət</p>
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
                  title="Xərc və ödəniş"
                  desc="Partiya xərcləri, endirim və ödəniş"
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
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-stone-700">
                      Endirim (ümumi)
                    </p>
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg font-bold tabular-nums text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </div>
                  <PaymentBlock
                    payType={payType}
                    setPayType={setPayType}
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

                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <p className="mb-2 text-sm font-semibold text-stone-600">
                      Endirim (ümumi)
                    </p>
                    <input
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0"
                      className="h-14 w-full rounded-xl border border-stone-300 bg-white px-4 text-xl font-bold tabular-nums text-stone-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <PaymentBlock
                  payType={payType}
                  setPayType={setPayType}
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

      <NewCustomerModal
        open={newCusOpen}
        onClose={() => {
          setNewCusOpen(false);
          setNewCusName("");
        }}
        initialName={newCusName}
        onCreated={(customer) => {
          setPayType("Nisyə");
          setCustomerId(customer.id);
        }}
      />
      <LossConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={complete}
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

/** Ödəniş növü + nisyə müştəri seçimi. */
function PaymentBlock({
  payType,
  setPayType,
  customers,
  customerId,
  setCustomerId,
  onNewCustomer,
}: {
  payType: PaymentType;
  setPayType: (v: PaymentType) => void;
  customers: Customer[];
  customerId: string;
  setCustomerId: (v: string) => void;
  onNewCustomer: (prefillName?: string) => void;
}) {
  return (
    <>
      <div>
        <p className="mb-2 text-sm font-semibold text-stone-600">Ödəniş növü</p>
        <div className="grid grid-cols-3 gap-2.5">
          {PAY_TYPES.map(({ key, label, Icon, on, off }) => (
            <button
              key={key}
              type="button"
              onClick={() => setPayType(key)}
              className={cn(
                "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border-2 text-base font-bold transition",
                payType === key ? on : off,
              )}
            >
              <Icon size={24} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {payType === "Nisyə" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
          <p className="mb-2 text-sm font-semibold text-stone-600">Müştəri</p>
          <CustomerPicker
            customers={customers}
            value={customerId}
            onChange={setCustomerId}
            onCreateNew={onNewCustomer}
          />
          <Button
            variant="secondary"
            size="lg"
            className="mt-2 w-full justify-center"
            icon={<Plus size={18} />}
            onClick={() => onNewCustomer()}
          >
            Yeni müştəri
          </Button>
        </div>
      )}
    </>
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
              {profit >= 0 ? "+" : ""}
              {fmtMoney(profit)}
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
