import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  HandCoins,
  Wallet,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { fmtMoney, parseMoneyInput, roundMoney } from "@/lib/format";
import { CustomerSelectBlock } from "./CustomerSelectBlock";
import type { Customer, PaymentType } from "@/types";

/** Ödənişin faktiki alındığı üsul — backend yalnız bu ikisini qəbul edir. */
type PaidVia = "Nağd" | "Kart";

type Choice = "full" | "partial" | "unpaid";

const VIA_OPTIONS: { key: PaidVia; Icon: LucideIcon; on: string }[] = [
  { key: "Nağd", Icon: Wallet, on: "border-emerald-600 bg-emerald-600 text-white" },
  { key: "Kart", Icon: CreditCard, on: "border-indigo-600 bg-indigo-600 text-white" },
];

const CHOICES: {
  key: Choice;
  label: string;
  Icon: LucideIcon;
  on: string;
}[] = [
  {
    key: "full",
    label: "Tam ödədi",
    Icon: CheckCircle2,
    on: "border-emerald-600 bg-emerald-600 text-white",
  },
  {
    key: "partial",
    label: "Qismən ödədi",
    Icon: HandCoins,
    on: "border-amber-500 bg-amber-500 text-white",
  },
  {
    key: "unpaid",
    label: "Ödəmədi",
    Icon: XCircle,
    on: "border-orange-500 bg-orange-500 text-white",
  },
];

export interface PaymentConfirmPayload {
  paymentType: PaymentType;
  paidAmount: number;
  /** Ödənilən hissənin üsulu — backend yalnız "Nağd"/"Kart" qəbul edir. */
  paidVia?: PaidVia;
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
 * açılır: Tam / Qismən / Ödəmədi seçimi. Qalıq borc qalırsa müştəri
 * məcburidir — backend `SaleWriteValidator` qaydası ilə eyni (qalıq > 0 →
 * müştəri), ona görə yekunla eyni məbləğ yazılanda blok götürülür.
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
  const [via, setVia] = useState<PaidVia | null>(null);
  const [partialRaw, setPartialRaw] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);

  // Hər açılışda təzə başla — köhnə seçim qalmasın.
  useEffect(() => {
    if (open) {
      setChoice(null);
      setVia(null);
      setPartialRaw("");
    }
  }, [open]);

  // Seçimdən sonra açılan blok (input/toqqlu) klaviatura qalxanda da görünsün.
  useEffect(() => {
    if (choice) detailRef.current?.scrollIntoView({ block: "nearest" });
  }, [choice]);

  // "300,50" → 300.5; sərbəst mətn/mənfi dəyər → null (sahə səhv işarələnir).
  const partialTouched = partialRaw.trim() !== "";
  const partialValue = parseMoneyInput(partialRaw);
  const partialError: string | null = !partialTouched
    ? null
    : partialValue == null
      ? "Yalnız rəqəm yazın (məs. 300 və ya 300,50)"
      : partialValue <= 0
        ? "Məbləğ 0-dan böyük olmalıdır — pul verilməyibsə «Ödəmədi» seçin"
        : null;
  // Sahə hələ boşdur: bu səhv deyil, sadəcə tamamlanmayıb — ona görə input
  // qırmızıya boyanmır, müştəri bloku kimi amber izah göstərilir (FE#35).
  // İzah blur/klik gözləmədən dərhal görünür: "Təsdiqlə" disabled olduğuna
  // görə onun onClick-i heç vaxt işə düşmür və mesaj gizli qala bilərdi.
  const partialMissing = choice === "partial" && !partialTouched;
  const partialOverLimit = partialValue != null && partialValue > net;
  // Yekundan çox yazılıbsa yekunla məhdudlaşdırılır (mənfi qalıq mümkün deyil).
  const partialPaid =
    partialValue != null && partialError == null
      ? Math.min(partialValue, net)
      : 0;

  const paidAmount =
    choice === "full" ? net : choice === "partial" ? partialPaid : 0;
  const remaining = choice ? roundMoney(Math.max(0, net - paidAmount)) : 0;

  // Müştəri seçimi qismən/ödəmədidə görünür (AC4); bloklama isə backend
  // qaydası ilə eynidir — YALNIZ qalıq borc qalanda.
  const customerVisible = choice === "partial" || choice === "unpaid";
  const customerRequired = customerVisible && remaining > 0;
  const viaRequired = choice === "full" || choice === "partial";

  // Qismən ödənişdə sahə HƏM dolu olmalı, HƏM də səhvsiz — boş sahə ilə
  // paidAmount=0 / "Nisyə" göndərilməsinin qarşısını alır (FE#35).
  const canConfirm =
    !!choice &&
    (choice !== "partial" || (partialTouched && partialError == null)) &&
    (!viaRequired || !!via) &&
    (!customerRequired || !!customerId);

  const confirm = () => {
    if (!canConfirm || !choice || pending) return;
    const fullyPaid = remaining <= 0;
    onConfirm({
      // Qalıq varsa satış nisyədir; tam ödənilibsə pulun gəldiyi üsul saxlanılır
      // (backend `SalePaymentPlan.Resolve` ilə eyni nəticə).
      paymentType: fullyPaid ? (via ?? "Nağd") : "Nisyə",
      paidAmount: roundMoney(paidAmount),
      // Pul alınmayıbsa (Ödəmədi) üsul göndərilmir — köhnə seçim qalıb
      // yanlış "Kart medaxili" kimi yazılmasın.
      paidVia: paidAmount > 0 ? (via ?? undefined) : undefined,
      customerId: customerId || null,
    });
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
          <p id="pay-choice-label" className="mb-2 text-sm font-semibold text-stone-700">
            Müştəri ödəniş etdi?
          </p>
          <div
            role="group"
            aria-labelledby="pay-choice-label"
            className="grid grid-cols-3 gap-2"
          >
            {CHOICES.map(({ key, label, Icon, on }) => (
              <button
                key={key}
                type="button"
                aria-pressed={choice === key}
                onClick={() => setChoice(key)}
                className={cn(
                  "flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-1 text-center text-sm font-bold leading-tight transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 active:scale-[0.98]",
                  choice === key
                    ? on
                    : "border-stone-200 bg-white text-stone-600",
                )}
              >
                <Icon size={22} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={detailRef} className="space-y-3">
          {/* Qismən ödədi → böyük rəqəm inputu */}
          {choice === "partial" && (
            <div>
              <label
                htmlFor="partial-amount"
                className="mb-1.5 block text-sm font-semibold text-stone-700"
              >
                Nə qədər verdi?{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="partial-amount"
                value={partialRaw}
                onChange={(e) => setPartialRaw(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirm();
                  }
                }}
                inputMode="decimal"
                autoComplete="off"
                autoFocus
                placeholder="0"
                aria-invalid={!!partialError || undefined}
                aria-describedby="partial-amount-hint"
                className={cn(
                  "h-16 w-full rounded-2xl border-2 bg-white px-4 text-3xl font-bold tabular-nums outline-none focus:ring-4",
                  partialError
                    ? "border-red-400 text-red-600 focus:border-red-500 focus:ring-red-500/20"
                    : "border-stone-300 text-stone-900 focus:border-emerald-500 focus:ring-emerald-500/20",
                )}
              />
              <p
                id="partial-amount-hint"
                className="mt-1 min-h-4 text-xs"
                role="status"
                aria-live="polite"
              >
                {partialError ? (
                  <span className="font-semibold text-red-600">
                    {partialError}
                  </span>
                ) : partialMissing ? (
                  <span className="font-semibold text-amber-700">
                    Alınan məbləği yazın — «Təsdiqlə» bloklanıb.
                  </span>
                ) : partialOverLimit ? (
                  <span className="font-semibold text-amber-700">
                    Yekundan çox ola bilməz — {fmtMoney(net)} qəbul olunacaq
                  </span>
                ) : null}
              </p>
            </div>
          )}

          {/* Tam/qismən ödənişdə pulun necə alındığı */}
          {viaRequired && <ViaToggle via={via} setVia={setVia} />}

          {/* Canlı qalıq borc — seçim edilən kimi görünür */}
          {choice && remaining > 0 && <RemainingBanner amount={remaining} />}
        </div>

        {/* Müştəri — qalıq borc qalanda məcburi */}
        {customerVisible && (
          <CustomerSelectBlock
            customers={customers}
            customerId={customerId}
            setCustomerId={setCustomerId}
            onNewCustomer={onNewCustomer}
            required={customerRequired}
            requiredHint="Qalıq borc üçün müştəri seçilməlidir — «Təsdiqlə» bloklanıb."
          />
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
          disabled={!canConfirm}
          loading={pending}
        >
          {pending ? "Göndərilir..." : "Təsdiqlə"}
        </Button>
      </div>
    </Modal>
  );
}

/** Canlı qalıq borc — dəyişəndə ekran oxuyucusu da eşitsin (aria-live). */
function RemainingBanner({ amount }: { amount: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200"
    >
      <span className="text-sm font-semibold text-red-700">Qalıq borc</span>
      <span className="text-xl font-bold tabular-nums text-red-700">
        {fmtMoney(amount)}
      </span>
    </div>
  );
}

function ViaToggle({
  via,
  setVia,
}: {
  via: PaidVia | null;
  setVia: (v: PaidVia) => void;
}) {
  return (
    <div>
      <p id="pay-via-label" className="mb-1.5 text-sm font-semibold text-stone-700">
        Necə ödədi?{" "}
        <span className="text-red-500" aria-hidden="true">
          *
        </span>
      </p>
      <div
        role="group"
        aria-labelledby="pay-via-label"
        className="grid grid-cols-2 gap-2.5"
      >
        {VIA_OPTIONS.map(({ key, Icon, on }) => (
          <button
            key={key}
            type="button"
            aria-pressed={via === key}
            onClick={() => setVia(key)}
            className={cn(
              "flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30",
              via === key ? on : "border-stone-200 bg-white text-stone-600",
            )}
          >
            <Icon size={20} aria-hidden="true" />
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
