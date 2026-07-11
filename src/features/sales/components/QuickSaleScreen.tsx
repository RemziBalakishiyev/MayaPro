import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CreditCard,
  HandCoins,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { useCustomers } from "@/features/customers/queries";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { netTotal, saleProfit, isLossSale } from "../lib";
import { useCreateSale, useSales, useTodaySales } from "../queries";
import { TodaySalesList } from "./TodaySalesList";
import { LossConfirmModal } from "./LossConfirmModal";
import type { PaymentType, Product } from "@/types";

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
  const { data: allSales = [] } = useSales();
  const { data: todaySales = [] } = useTodaySales();
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

  // ——— Yalnız təqdimat state ———
  const [search, setSearch] = useState("");
  const [cusQuery, setCusQuery] = useState("");
  const [newCusOpen, setNewCusOpen] = useState(false);
  const [todayOpen, setTodayOpen] = useState(false);
  const [success, setSuccess] = useState<{ name: string; amount: number } | null>(
    null,
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const product = products.find((p) => p.id === productId);
  const inStock = products.filter((p) => p.quantity > 0);

  // Mal dəyişəndə qiymət default = malın satış qiyməti
  useEffect(() => {
    if (product) setPrice(String(product.salePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  // Seçim ekranına qayıdanda axtarışa fokus
  useEffect(() => {
    if (!productId && !success) searchRef.current?.focus();
  }, [productId, success]);

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
  const realCost = product?.realCostPerUnit ?? 0;
  const net = netTotal(sp, q, disc);
  const profit = saleProfit(sp, q, disc, realCost);
  const belowCost = !!product && isLossSale(sp, realCost);
  const notEnoughStock = !!product && q > product.quantity;

  const canSubmit =
    !!product &&
    sp > 0 &&
    !notEnoughStock &&
    (payType !== "Nisyə" || !!customerId);

  const reset = () => {
    setProductId("");
    setQty("1");
    setPrice("");
    setDiscount("");
    setPayType("Nağd");
    setCustomerId("");
    setNote("");
    setSearch("");
    setCusQuery("");
  };

  const complete = async () => {
    if (!product) return;
    const captured = { name: product.name, amount: net };
    try {
      await createSale.mutateAsync({
        productId: product.id,
        quantity: q,
        salePrice: sp,
        discount: disc,
        paymentType: payType,
        customerId: payType === "Nisyə" ? customerId : null,
        note: note.trim() || undefined,
      });
      setSuccess(captured);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Satış alınmadı");
    }
  };

  const trySubmit = () => {
    if (profit < 0) setConfirmOpen(true);
    else complete();
  };

  const selectProduct = (p: Product) => {
    if (p.quantity <= 0) return;
    setProductId(p.id);
    setQty("1");
    setDiscount("");
    setCustomerId("");
  };

  const changeProduct = () => {
    setProductId("");
    setQty("1");
    setDiscount("");
  };

  const step = (delta: number) => {
    const max = product?.quantity ?? 1;
    setQty((prev) => String(Math.min(max, Math.max(1, (Number(prev) || 1) + delta))));
  };

  // Seçim ekranı üçün mallar: axtarış nəticəsi, yoxdursa tez-tez satılanlar
  const topProductIds = useMemo(() => {
    const cnt: Record<string, number> = {};
    allSales.forEach((s) => {
      cnt[s.productId] = (cnt[s.productId] ?? 0) + s.quantity;
    });
    return Object.entries(cnt)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }, [allSales]);

  const shownProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query) {
      return products.filter((p) =>
        `${p.name} ${p.barcode} ${p.model} ${p.category} ${p.color}`
          .toLowerCase()
          .includes(query),
      );
    }
    const frequent = topProductIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p && p.quantity > 0)
      .slice(0, 10);
    return frequent.length > 0 ? frequent : inStock.slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, products, topProductIds]);

  const filteredCustomers = useMemo(() => {
    const query = cusQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) || (c.phone || "").includes(query),
    );
  }, [cusQuery, customers]);

  const todayTotal = todaySales.reduce((s, x) => s + x.totalAmount, 0);

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

  const todayChip = (
    <button
      onClick={() => setTodayOpen(true)}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-card ring-1 ring-stone-200 active:bg-stone-50 lg:hidden"
    >
      <ShoppingCart size={16} className="text-emerald-700" />
      Bu gün: {todaySales.length} satış · {fmtMoney(todayTotal)}
    </button>
  );

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      {/* SOL: seçim və ya detallar */}
      <div className="pb-28 lg:pb-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-stone-900 lg:text-3xl">Satış</h1>
          {todayChip}
        </div>

        {!product ? (
          /* ——— MAL SEÇİMİ ——— */
          <div>
            <div className="relative mb-4">
              <Search
                size={22}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                placeholder="Mal adı və ya barkod..."
                className="h-[52px] w-full rounded-2xl border border-stone-300 bg-white pl-12 pr-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
              />
            </div>

            {!search.trim() && (
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-stone-400">
                Tez-tez satılanlar
              </p>
            )}

            {shownProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
                <p className="text-base font-bold text-stone-600">Mal tapılmadı</p>
                <p className="mt-1 text-sm text-stone-500">
                  Başqa ad və ya barkod yoxlayın.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {shownProducts.map((p) => {
                  const out = p.quantity <= 0;
                  const low = p.quantity <= p.minStock;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      disabled={out}
                      className={cn(
                        "flex flex-col justify-between gap-3 rounded-2xl border bg-white p-4 text-left shadow-card transition active:scale-[0.98]",
                        out
                          ? "cursor-not-allowed border-stone-200 opacity-60"
                          : "border-stone-200 hover:border-emerald-400 hover:shadow-md",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 min-h-[2.5rem] text-base font-bold text-stone-900">
                          {p.name}
                        </p>
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
            )}
          </div>
        ) : (
          /* ——— SATIŞ DETALLARI ——— */
          <div className="space-y-4">
            {/* Seçilmiş mal */}
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-stone-900">
                  {product.name}
                </p>
                <p className="text-sm text-stone-500">
                  {fmtMoney(product.salePrice)} · stok: {product.quantity} əd.
                </p>
              </div>
              <button
                onClick={changeProduct}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-white px-4 text-base font-semibold text-stone-700 ring-1 ring-stone-300 active:bg-stone-100"
              >
                <ArrowLeft size={18} /> Dəyiş
              </button>
            </div>

            {/* Say — nəhəng stepper */}
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-600">Say</p>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-2">
                <button
                  onClick={() => step(-1)}
                  disabled={q <= 1}
                  aria-label="Azalt"
                  className="flex h-16 w-16 items-center justify-center rounded-xl bg-stone-100 text-stone-700 active:bg-stone-200 disabled:opacity-40"
                >
                  <Minus size={28} />
                </button>
                <input
                  value={qty}
                  onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ""))}
                  inputMode="numeric"
                  className="w-20 bg-transparent text-center text-4xl font-bold tabular-nums text-stone-900 outline-none"
                />
                <button
                  onClick={() => step(1)}
                  disabled={!!product && q >= product.quantity}
                  aria-label="Artır"
                  className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-600 text-white active:bg-emerald-700 disabled:opacity-40"
                >
                  <Plus size={28} />
                </button>
              </div>
              {notEnoughStock && (
                <p className="mt-1.5 text-sm font-semibold text-red-600">
                  Stokda yalnız {product.quantity} əd. var.
                </p>
              )}
            </div>

            {/* Qiymət və endirim */}
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

            {belowCost && (
              <div className="flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3.5 text-base font-bold text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={22} className="shrink-0" />
                Bu qiymətə satsan ziyana düşürsən! Minimum: {fmtMoney(realCost)}
              </div>
            )}

            {/* Ödəniş növü — 3 nəhəng düymə */}
            <div>
              <p className="mb-2 text-sm font-semibold text-stone-600">
                Ödəniş növü
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {PAY_TYPES.map(({ key, label, Icon, on, off }) => (
                  <button
                    key={key}
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

            {/* Nisyə → müştəri seçimi */}
            {payType === "Nisyə" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3">
                <div className="relative mb-2">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  />
                  <input
                    value={cusQuery}
                    onChange={(e) => setCusQuery(e.target.value)}
                    placeholder="Müştəri axtar..."
                    className="h-12 w-full rounded-xl border border-stone-300 bg-white pl-10 pr-3 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="max-h-52 space-y-1.5 overflow-y-auto">
                  {filteredCustomers.length === 0 ? (
                    <p className="px-2 py-3 text-center text-sm text-stone-500">
                      Müştəri tapılmadı
                    </p>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCustomerId(c.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-xl border-2 bg-white px-3 py-3 text-left transition",
                          customerId === c.id
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-stone-200",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate text-base font-semibold text-stone-800">
                          {c.name}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-bold tabular-nums",
                            c.remainingDebt > 0
                              ? "text-red-600"
                              : "text-emerald-700",
                          )}
                        >
                          {c.remainingDebt > 0
                            ? `borc: ${fmtMoney(c.remainingDebt)}`
                            : "borcsuz"}
                        </span>
                      </button>
                    ))
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="lg"
                  className="mt-2 w-full justify-center"
                  icon={<Plus size={18} />}
                  onClick={() => setNewCusOpen(true)}
                >
                  Yeni müştəri
                </Button>
              </div>
            )}

            {/* Qeyd */}
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qeyd (istəyə bağlı)"
              className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-base outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20"
            />

            {/* Desktop cəmi paneli (sağ sütun yoxdursa da görünsün deyə mobil sticky ayrıca) */}
          </div>
        )}
      </div>

      {/* SAĞ (desktop): cəmi + bugünkü satışlar */}
      <div className="hidden lg:flex lg:flex-col lg:gap-4">
        {product && (
          <div className="sticky top-20 rounded-2xl border border-stone-200 bg-white p-5 shadow-card">
            <TotalContent
              net={net}
              profit={profit}
              canSubmit={canSubmit}
              pending={createSale.isPending}
              onSubmit={trySubmit}
            />
          </div>
        )}
        <div className="rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="border-b border-stone-100 px-5 py-4">
            <h3 className="text-base font-bold text-stone-800">
              Bugünkü satışlar ({todaySales.length})
            </h3>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-5">
            <TodaySalesList sales={todaySales} />
          </div>
        </div>
      </div>

      {/* MOBİL: sabit aşağı cəmi paneli (yalnız detallarda) */}
      {product && (
        <div className="fixed inset-x-0 bottom-[72px] z-30 border-t border-stone-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
          <TotalContent
            net={net}
            profit={profit}
            canSubmit={canSubmit}
            pending={createSale.isPending}
            onSubmit={trySubmit}
          />
        </div>
      )}

      {/* Bugünkü satışlar drawer (mobil) */}
      <Drawer
        open={todayOpen}
        onClose={() => setTodayOpen(false)}
        title={`Bugünkü satışlar (${todaySales.length})`}
      >
        <TodaySalesList sales={todaySales} />
      </Drawer>

      <NewCustomerModal
        open={newCusOpen}
        onClose={() => setNewCusOpen(false)}
        onCreated={(customer) => {
          setPayType("Nisyə");
          setCustomerId(customer.id);
        }}
      />
      <LossConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={complete}
        lossAmount={profit}
      />
    </div>
  );
}

/** Cəmi + qazanc + "Satışı tamamla" — mobil sticky və desktop paneldə eyni. */
function TotalContent({
  net,
  profit,
  canSubmit,
  pending,
  onSubmit,
}: {
  net: number;
  profit: number;
  canSubmit: boolean;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Cəmi
          </p>
          <p className="text-3xl font-bold tabular-nums text-stone-900">
            {fmtMoney(net)}
          </p>
        </div>
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            profit < 0 ? "text-red-600" : "text-emerald-700",
          )}
        >
          Qazanc: {profit >= 0 ? "+" : ""}
          {fmtMoney(profit)}
        </p>
      </div>
      <button
        onClick={onSubmit}
        disabled={!canSubmit || pending}
        className="flex h-[60px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 text-lg font-bold text-white transition active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Check size={22} strokeWidth={3} /> SATIŞI TAMAMLA
      </button>
    </div>
  );
}
