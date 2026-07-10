import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  CreditCard,
  HandCoins,
  Plus,
  Printer,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney } from "@/lib/format";
import { useProducts } from "@/features/products/queries";
import { useCustomers } from "@/features/customers/queries";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { netTotal, saleProfit, isLossSale } from "../lib";
import { useCreateSale } from "../queries";
import { SaleCalculator } from "./SaleCalculator";
import { LossConfirmModal } from "./LossConfirmModal";
import type { PaymentType } from "@/types";

const PAY_TYPES: PaymentType[] = ["Nağd", "Kart", "Nisyə"];

export function QuickSaleScreen() {
  const toast = useToast();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const createSale = useCreateSale();

  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [payType, setPayType] = useState<PaymentType>("Nağd");
  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [newCusOpen, setNewCusOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const product = products.find((p) => p.id === productId);
  const inStock = products.filter((p) => p.quantity > 0);

  useEffect(() => {
    if (product) setPrice(String(product.salePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

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
  };

  const complete = async () => {
    if (!product) return;
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
      toast.success(`Satış tamamlandı: ${product.name} × ${q} — ${fmtMoney(net)}`);
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Satış alınmadı");
    }
  };

  const trySubmit = () => {
    if (profit < 0) setConfirmOpen(true);
    else complete();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="Mal seç" required>
                  <Select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">Mal seçin...</option>
                    {inStock.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — stok: {p.quantity} — {fmtMoney(p.salePrice)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Barkod scan">
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-400">
                  <Printer size={15} /> Skan gözlənilir...
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Say" required>
                <Input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
              </Field>
              <Field label="Satış qiyməti (1 əd.)" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field label="Endirim (ümumi)">
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Ödəniş növü">
              <div className="grid grid-cols-3 gap-2">
                {PAY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPayType(t)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                      payType === t
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                        : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {t === "Nağd" ? (
                      <Wallet size={15} />
                    ) : t === "Kart" ? (
                      <CreditCard size={15} />
                    ) : (
                      <HandCoins size={15} />
                    )}{" "}
                    {t}
                  </button>
                ))}
              </div>
            </Field>

            {payType === "Nisyə" && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Field label="Müştəri" required>
                    <Select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">Müştəri seçin...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (borc: {fmtMoney(c.remainingDebt)})
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Button
                  variant="secondary"
                  icon={<Plus size={14} />}
                  onClick={() => setNewCusOpen(true)}
                >
                  Yeni
                </Button>
              </div>
            )}

            <Field label="Qeyd">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="İstəyə bağlı"
              />
            </Field>

            {notEnoughStock && (
              <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={15} /> Stokda kifayət qədər mal yoxdur
                (mövcud: {product?.quantity} əd.)
              </p>
            )}
            {belowCost && (
              <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-700 ring-1 ring-red-200">
                <AlertTriangle size={15} /> Bu qiymətə satsan ziyana düşürsən.
                Minimum qiymət: {fmtMoney(realCost)}
              </p>
            )}

            <Button
              size="lg"
              className="w-full justify-center"
              disabled={!canSubmit || createSale.isPending}
              onClick={trySubmit}
              icon={<Check size={17} />}
            >
              Satışı tamamla — {fmtMoney(net)}
            </Button>
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <SaleCalculator
          hasProduct={!!product}
          realCost={realCost}
          qty={q}
          salePrice={sp}
          discount={disc}
        />
      </div>

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
