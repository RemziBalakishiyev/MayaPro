import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  HandCoins,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { Drawer } from "@/components/ui/Drawer";
import {
  ExpenseRows,
  incompleteExpenseIndexes,
  type ExpenseRowValue,
} from "@/components/ui/ExpenseRows";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/toast-store";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import { CategoryField } from "@/features/categories/components/CategoryField";
import { NewCustomerModal } from "@/features/customers/components/NewCustomerModal";
import { useCustomers } from "@/features/customers/queries";
import { mergeExpenseLines } from "@/features/products/lib";
import { useCan } from "@/features/auth/store";
import { netTotal } from "../lib";
import { useSaleDetail, useUpdateSale } from "../queries";
import { QtyStepper } from "./QtyStepper";
import type { PaymentType } from "@/types";

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

interface Props {
  saleId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

/** Mövcud satışın düzəliş drawer-i (say/qiymət/endirim/ödəniş/müştəri; sərbəstdə ad/kateqoriya/xərclər). */
export function SaleEditDrawer({ saleId, onClose, onSaved }: Props) {
  const toast = useToast();
  const canManage = useCan()("sales.manage");
  const { data: sale, isLoading, isError, error } = useSaleDetail(saleId);
  const { data: customers = [] } = useCustomers();
  const updateSale = useUpdateSale();

  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [payType, setPayType] = useState<PaymentType>("Nağd");
  const [customerId, setCustomerId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [expenseRows, setExpenseRows] = useState<ExpenseRowValue[]>([]);
  const [expenseError, setExpenseError] = useState("");
  const [newCusOpen, setNewCusOpen] = useState(false);
  const [newCusName, setNewCusName] = useState("");

  useEffect(() => {
    if (!sale) return;
    setQty(String(sale.quantity));
    setPrice(String(sale.salePrice));
    setDiscount(sale.discount ? String(sale.discount) : "");
    setPayType(sale.paymentType);
    setCustomerId(sale.customerId ?? "");
    setManualName(sale.isManual ? sale.productName : "");
    setManualCategory(sale.isManual ? sale.category ?? "" : "");
    setExpenseRows(
      sale.isManual
        ? (sale.expenseItems ?? []).map((e) => ({
            name: e.name,
            amount: e.amount,
          }))
        : [],
    );
    setExpenseError("");
  }, [sale]);

  const isManual = !!sale?.isManual;
  const q = Math.max(1, Number(qty) || 1);
  const sp = Number(price) || 0;
  const disc = Number(discount) || 0;
  const net = netTotal(sp, q, disc);
  const namedExpenses = useMemo(
    () => mergeExpenseLines(expenseRows),
    [expenseRows],
  );

  const canSubmit =
    canManage &&
    !!sale &&
    sp > 0 &&
    (!isManual || manualName.trim().length > 0) &&
    (payType !== "Nisyə" || !!customerId);

  const save = async () => {
    if (!sale || !canSubmit) return;
    if (isManual && incompleteExpenseIndexes(expenseRows).length > 0) {
      setExpenseError("Məbləği olan xərc sətirində ad yazılmalıdır");
      return;
    }
    try {
      await updateSale.mutateAsync({
        id: sale.id,
        input: {
          productId: sale.productId,
          productName: isManual ? manualName.trim() : undefined,
          category: isManual
            ? manualCategory.trim() || null
            : sale.category ?? null,
          isManual,
          quantity: q,
          salePrice: sp,
          discount: disc,
          paymentType: payType,
          customerId: payType === "Nisyə" ? customerId : null,
          costPerUnit: isManual ? (sale.costPerUnit ?? null) : undefined,
          expenseItems:
            isManual && namedExpenses.length > 0 ? namedExpenses : undefined,
        },
      });
      toast.success("Satış yeniləndi");
      onSaved?.();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error(e.message || "Gün bağlanıb");
      } else {
        toast.error(e instanceof Error ? e.message : "Satış yenilənmədi");
      }
    }
  };

  return (
    <>
      <Drawer
        open={!!saleId}
        onClose={onClose}
        title="Satışı düzəliş et"
        footer={
          sale && canManage ? (
            <div className="border-t border-stone-200 bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-stone-500">Yekun</span>
                <span className="text-lg font-bold tabular-nums text-stone-900">
                  {fmtMoney(net)}
                </span>
              </div>
              <Button
                className="w-full justify-center"
                disabled={!canSubmit || updateSale.isPending}
                onClick={() => void save()}
              >
                Yadda saxla
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
          <div className="space-y-4">
            {!isManual && (
              <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                <p className="text-sm font-semibold text-stone-800">
                  {sale.productName}
                </p>
                {sale.category && (
                  <p className="text-xs text-stone-400">{sale.category}</p>
                )}
              </div>
            )}

            {isManual && (
              <>
                <Field label="Mal adı" required>
                  <Input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                </Field>
                <Field label="Kateqoriya">
                  <CategoryField
                    value={manualCategory}
                    onChange={setManualCategory}
                  />
                </Field>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-stone-700">
                    Xərclər
                  </p>
                  <ExpenseRows
                    value={expenseRows}
                    onChange={(rows) => {
                      setExpenseRows(rows);
                      setExpenseError("");
                    }}
                  />
                  {expenseError && (
                    <p className="mt-1 text-xs text-red-600">{expenseError}</p>
                  )}
                </div>
              </>
            )}

            <Field label="Say" required>
              <QtyStepper
                value={qty}
                onChange={setQty}
                onStep={(d) =>
                  setQty(String(Math.max(1, (Number(qty) || 1) + d)))
                }
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Qiymət" required>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Field>
              <Field label="Endirim">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-stone-700">
                Ödəniş növü
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PAY_TYPES.map(({ key, label, Icon, on, off }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPayType(key)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border-2 py-2.5 text-xs font-bold transition",
                      payType === key ? on : off,
                    )}
                  >
                    <Icon size={18} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {payType === "Nisyə" && (
              <Field label="Müştəri" required>
                <CustomerPicker
                  customers={customers}
                  value={customerId}
                  onChange={setCustomerId}
                  onCreateNew={(name) => {
                    setNewCusName(name);
                    setNewCusOpen(true);
                  }}
                />
              </Field>
            )}
          </div>
        )}
      </Drawer>

      <NewCustomerModal
        open={newCusOpen}
        onClose={() => setNewCusOpen(false)}
        initialName={newCusName}
        onCreated={(c) => setCustomerId(c.id)}
      />
    </>
  );
}
