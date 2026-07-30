import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  HandCoins,
  Plus,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";
import type { Customer, PaymentType } from "@/types";

type Choice = "full" | "partial" | "unpaid";

const VIA_OPTIONS: {
  key: "Nağd" | "Kart";
  label: string;
  Icon: LucideIcon;
  on: string;
}[] = [
  {
    key: "Nağd",
    label: "Nağd",
    Icon: Wallet,
    on: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    key: "Kart",
    label: "Kart",
    Icon: CreditCard,
    on: "border-indigo-600 bg-indigo-600 text-white",
  },
];

export interface PaymentConfirmPayload {
  paymentType: PaymentType;
  paidAmount: number;
  /** Ödənilən hissənin üsulu — backend yalnız "Nağd"/"Kart" qəbul edir. */
  paidVia?: "Nağd" | "Kart";
  customerId: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Endirimdən sonrakı yekun məbləğ. */
  net: number;
  pending: boolean;
  customers: Customer[];
  customerId: string;
  setCustomerId: (v: string) => void;
  onNewCustomer: (prefillName?: string) => void;
  onConfirm: (payload: PaymentConfirmPayload) => void;
}

/**
 * Kassa üslubu ödəniş təsdiq modalı (FE#25) — "SATIŞI TAMAMLA"dan sonra
 * açılır: Tam / Qismən / Ödəmədi seçimi; qismən və ödəmədidə müştəri
 * məcburidir (backend qaydası ilə eyni — SaleWriteValidator).
 */
export function PaymentConfirmModal({
  open,
  onClose,
  net,
  pending,
  customers,
  customerId,
  setCustomerId,
  onNewCustomer,
  onConfirm,
}: Props) {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [via, setVia] = useState<"Nağd" | "Kart" | null>(null);
  const [partialRaw, setPartialRaw] = useState("");

  // Hər açılışda təzə başla — köhnə seçim qalmasın.
  useEffect(() => {
    if (open) {
      setChoice(null);
      setVia(null);
      setPartialRaw("");
    }
  }, [open]);

  const partialNum = Number(partialRaw.trim());
  const partialFormatOk =
    partialRaw.trim() !== "" && Number.isFinite(partialNum) && partialNum > 0;
  const partialInvalid = !partialFormatOk;
  const partialOverLimit = partialFormatOk && partialNum > net;
  // Yekundan çox yazılıbsa yekunlə məhdudlaşdırılır (mənfi qalıq mümkün deyil).
  const effectivePartial = partialFormatOk ? Math.min(partialNum, net) : 0;

  const remaining =
    choice === "full"
      ? 0
      : choice === "partial"
        ? Math.max(0, net - effectivePartial)
        : choice === "unpaid"
          ? net
          : 0;

  const customerRequired = choice === "partial" || choice === "unpaid";
  const customerMissing = customerRequired && !customerId;

  const canConfirm =
    choice === "full"
      ? !!via
      : choice === "partial"
        ? !partialInvalid && !!via && !!customerId
        : choice === "unpaid"
          ? !!customerId
          : false;

  const confirm = () => {
    if (!canConfirm || !choice || pending) return;
    if (choice === "full") {
      onConfirm({
        paymentType: via!,
        paidAmount: net,
        paidVia: via!,
        customerId: customerId || null,
      });
    } else if (choice === "partial") {
      onConfirm({
        paymentType: "Nisyə",
        paidAmount: effectivePartial,
        paidVia: via!,
        customerId: customerId || null,
      });
    } else {
      onConfirm({
        paymentType: "Nisyə",
        paidAmount: 0,
        customerId: customerId || null,
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ödəniş">
      <div className="space-y-5">
        {/* Yuxarıda YEKUN — nəhəng rəqəm */}
        <div className="rounded-2xl bg-stone-50 px-4 py-5 text-center ring-1 ring-stone-200">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
            Yekun
          </p>
          <p className="mt-1 text-4xl font-extrabold tabular-nums text-stone-900 sm:text-5xl">
            {fmtMoney(net)}
          </p>
        </div>

        {/* 3 böyük seçim kartı */}
        <div>
          <p className="mb-2 text-sm font-semibold text-stone-700">
            Müştəri ödəniş etdi?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ChoiceCard
              active={choice === "full"}
              tone="emerald"
              label="Tam ödədi"
              icon={CheckCircle2}
              onClick={() => setChoice("full")}
            />
            <ChoiceCard
              active={choice === "partial"}
              tone="amber"
              label="Qismən ödədi"
              icon={HandCoins}
              onClick={() => setChoice("partial")}
            />
            <ChoiceCard
              active={choice === "unpaid"}
              tone="orange"
              label="Ödəmədi"
              icon={XCircle}
              onClick={() => setChoice("unpaid")}
            />
          </div>
        </div>

        {/* Tam ödədi → Nağd/Kart toqqlu */}
        {choice === "full" && <ViaToggle via={via} setVia={setVia} />}

        {/* Qismən ödədi → böyük input + toqqlu + canlı qalıq */}
        {choice === "partial" && (
          <div className="space-y-3">
            <div>
              <label
                htmlFor="partial-amount"
                className="mb-1.5 block text-sm font-semibold text-stone-700"
              >
                Nə qədər verdi?
              </label>
              <input
                id="partial-amount"
                value={partialRaw}
                onChange={(e) => setPartialRaw(e.target.value)}
                inputMode="decimal"
                autoFocus
                placeholder="0"
                aria-invalid={
                  (partialInvalid && partialRaw.trim() !== "") || undefined
                }
                aria-describedby="partial-amount-hint"
                className={cn(
                  "h-16 w-full rounded-2xl border-2 bg-white px-4 text-3xl font-bold tabular-nums outline-none focus:ring-4",
                  partialInvalid && partialRaw.trim() !== ""
                    ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-500/20"
                    : "border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500/20",
                )}
              />
              <p id="partial-amount-hint" className="mt-1 min-h-[16px] text-xs">
                {partialInvalid && partialRaw.trim() !== "" ? (
                  <span className="font-semibold text-red-600">
                    Düzgün məbləğ yazın (0-dan böyük)
                  </span>
                ) : partialOverLimit ? (
                  <span className="font-semibold text-amber-700">
                    Yekundan ({fmtMoney(net)}) çox ola bilməz — {fmtMoney(net)}{" "}
                    qəbul olunacaq
                  </span>
                ) : null}
              </p>
            </div>

            <ViaToggle via={via} setVia={setVia} />

            <RemainingBanner amount={remaining} />
          </div>
        )}

        {/* Ödəmədi → canlı qalıq = yekun */}
        {choice === "unpaid" && <RemainingBanner amount={remaining} />}

        {/* Müştəri — qismən/ödəmədidə məcburi */}
        {customerRequired && (
          <div
            className={cn(
              "rounded-2xl border p-3",
              customerMissing
                ? "border-amber-300 bg-amber-50"
                : "border-stone-200 bg-white",
            )}
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-stone-700">
                Müştəri <span className="text-red-500">*</span>
              </p>
              {!!customerId && (
                <button
                  type="button"
                  onClick={() => setCustomerId("")}
                  className="text-xs font-semibold text-stone-500 hover:text-emerald-700"
                >
                  Sil
                </button>
              )}
            </div>
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
            {customerMissing && (
              <p className="mt-2 text-sm font-semibold text-amber-800">
                Qalıq borc üçün müştəri seçilməlidir — Təsdiqlə düyməsi
                bloklanıb.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-5 flex gap-2 border-t border-stone-200 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 justify-center"
          onClick={onClose}
          disabled={pending}
        >
          Ləğv et
        </Button>
        <Button
          size="lg"
          className="flex-1 justify-center"
          onClick={confirm}
          disabled={!canConfirm || pending}
        >
          {pending ? "Göndərilir..." : "Təsdiqlə"}
        </Button>
      </div>
    </Modal>
  );
}

function RemainingBanner({ amount }: { amount: number }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
      <span className="text-sm font-semibold text-red-700">Qalıq borc</span>
      <span className="text-xl font-bold tabular-nums text-red-700">
        {fmtMoney(amount)}
      </span>
    </div>
  );
}

function ChoiceCard({
  active,
  tone,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  tone: "emerald" | "amber" | "orange";
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  const toneCls: Record<typeof tone, string> = {
    emerald: "border-emerald-600 bg-emerald-600 text-white",
    amber: "border-amber-500 bg-amber-500 text-white",
    orange: "border-orange-500 bg-orange-500 text-white",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 text-center text-sm font-bold leading-tight transition active:scale-[0.98]",
        active ? toneCls[tone] : "border-stone-200 bg-white text-stone-600",
      )}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );
}

function ViaToggle({
  via,
  setVia,
}: {
  via: "Nağd" | "Kart" | null;
  setVia: (v: "Nağd" | "Kart") => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-stone-700">
        Necə ödədi? <span className="text-red-500">*</span>
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {VIA_OPTIONS.map(({ key, label, Icon, on }) => (
          <button
            key={key}
            type="button"
            onClick={() => setVia(key)}
            className={cn(
              "flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition",
              via === key ? on : "border-stone-200 bg-white text-stone-600",
            )}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
