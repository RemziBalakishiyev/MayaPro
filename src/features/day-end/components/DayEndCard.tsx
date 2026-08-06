import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Check, Lock, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCard, type StatTone } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/toast-store";
import { TONE_TEXT } from "@/lib/ui-tokens";
import { ApiError } from "@/lib/api-client";
import { fmtMoney, fmtMoneySigned, fmtDate, todayISO } from "@/lib/format";
import { useSummary } from "@/features/reports/queries";
import { useCan } from "@/features/auth/store";
import { useClosings, useTodayClosing, useCloseDay } from "../queries";
import { expectedCash as calcExpected, difference as calcDiff } from "../lib";
import { cashDiffPresentation, type CashDiffTone } from "./cash-diff-presentation";

/** `cash-diff-presentation.ts` tonunu `StatCard`-ın öz ton adlarına çevirir. */
const STAT_TONE: Record<CashDiffTone, StatTone> = {
  success: "green",
  warning: "amber",
  danger: "red",
};

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 py-2.5 last:border-0">
      <span
        className={`text-sm ${bold ? "font-bold text-stone-900" : "text-stone-600"}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${
          bold ? "text-base font-bold" : "text-sm font-semibold"
        } ${tone ?? "text-stone-900"}`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * FE#77 — nömrələnmiş addım başlığı (bənd #2: "İş axını ÜÇ AYDIN MƏRHƏLƏ
 * kimi təqdim olunur"). Yalnız təqdimatdır — `Card` primitivi dəyişmir,
 * `title` slotuna ötürülür.
 */
function StepHeading({ n, children }: { n: number; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white"
      >
        {n}
      </span>
      <span>{children}</span>
    </span>
  );
}

/** `<p>` daxilində keçərli qalması üçün (`ConfirmModal.message` bir `<p>`-dir)
 *  bütün sətirlər `span`-dır, `div` YOXDUR. */
function ConfirmRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <span className="flex items-center justify-between py-0.5">
      <span className="text-stone-600">{label}</span>
      <span className={`font-bold tabular-nums ${tone ?? "text-stone-900"}`}>
        {value}
      </span>
    </span>
  );
}

export function DayEndCard() {
  const toast = useToast();
  const t = todayISO();
  // Gün cəmləri serverdən (mock rejimdə mock summary) — GET /api/reports/summary?period=today
  //
  // FE#77 yeniləməsi (əvvəlki FE#57 qeydini əvəz edir): BE#33 ilə
  // `GetSummaryHandler` artıq bugünkü işçi maaş ÖDƏNİŞLƏRİNİ (BE#28) də
  // `expenses` cəminə qatır (`expenses = generalExpenses + productExpenses +
  // salaryExpenses`, bax backend `docs/flows/DAYEND-FLOW.md`). Deməli bu
  // önizləmə (`expected` aşağıda) ilə faktiki `CloseDayHandler` bağlanışı
  // artıq EYNİ rəqəmi verir — köhnə uyğunsuzluq HƏLL OLUNUB.
  // `SummaryData.salaryExpenses` (əlavə, additiv sahə) yalnız bu cəmin bir
  // hissəsini AYRICA sətir kimi göstərmək üçün oxunur, `expected` düsturuna
  // heç nə ƏLAVƏ OLUNMUR (o, artıq `todayExpenses` daxilindədir).
  const { data: summary } = useSummary("today");
  const { data: closings = [] } = useClosings();
  const {
    data: todayClosing,
    refetch: refetchTodayClosing,
  } = useTodayClosing();
  const closeDay = useCloseDay();
  const canClose = useCan()("closings.write");

  const [openingCash, setOpeningCash] = useState("");
  const [touched, setTouched] = useState(false);
  const [actualCash, setActualCash] = useState("");
  const [note, setNote] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);
  // 409 "artıq bağlanıb" cavabı gələndə düymə dərhal deaktiv olsun deyə —
  // `todayClosing` sorğusu arxa fonda yenilənənə qədər keçən qısa pəncərə.
  const [justClosedElsewhere, setJustClosedElsewhere] = useState(false);

  const cashSales = summary?.cashSales ?? 0;
  const cardSales = summary?.cardSales ?? 0;
  const creditSales = summary?.creditSales ?? 0;
  const todayExpenses = summary?.expenses ?? 0;
  const salaryExpenses = summary?.salaryExpenses;

  // Açılış kassası defolt: ən son (dünənki) bağlanışın faktiki məbləği, yoxdursa 0
  const defaultOpening = useMemo(() => {
    const prior = closings
      .filter((c) => c.date < t)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return prior[0]?.actualCash ?? 0;
  }, [closings, t]);

  useEffect(() => {
    if (!touched) setOpeningCash(String(defaultOpening));
  }, [defaultOpening, touched]);

  const oc = Number(openingCash) || 0;
  const expected = calcExpected(oc, cashSales, todayExpenses);
  const ac = actualCash === "" ? null : Number(actualCash) || 0;
  const diff = ac === null ? null : calcDiff(ac, expected);
  const diffPresentation = diff === null ? null : cashDiffPresentation(diff);

  const disabledReason =
    ac === null
      ? "Faktiki məbləği yazın"
      : justClosedElsewhere
        ? "Bu gün artıq bağlanıb"
        : null;

  const doClose = async () => {
    setCloseError(null);
    try {
      // Server yalnız openingCash/actualCash/note qəbul edir; cəmləri özü hesablayır.
      await closeDay.mutateAsync({
        openingCash: oc,
        actualCash: ac ?? expected,
        note: note.trim() || undefined,
      });
      toast.success("Gün sonu bağlandı");
    } catch (e) {
      const isConflict =
        (e instanceof ApiError && e.status === 409) ||
        (e instanceof Error && /artıq bağlanıb/i.test(e.message));
      const msg = isConflict
        ? "Bu gün artıq bağlanıb"
        : e instanceof Error
          ? e.message
          : "Bağlanış alınmadı";
      setCloseError(msg);
      toast.error(msg);
      if (isConflict) {
        setJustClosedElsewhere(true);
        // Fon rejimində "artıq bağlanıb" xülasə kartına keçid üçün yenilə.
        void refetchTodayClosing();
      }
      // Yenidən atılır ki, `ConfirmModal` YALNIZ uğurda bağlansın (F-43) —
      // gün bağlanışı geri alınmayan əməliyyatdır, xəta halında dialoq
      // açıq qalıb səbəbi göstərməlidir.
      throw e;
    }
  };

  // Bugün artıq bağlanıbsa → xülasə kartı
  if (todayClosing) {
    // AC-12: bağlanmış gün xülasəsində də müsbət fərq kəhrəbadır — eyni
    // `cashDiffPresentation` qaydası (rəng tək siqnal deyil, ikon + mətn).
    const closedDiffPresentation = cashDiffPresentation(todayClosing.difference);
    return (
      <Card title={`${fmtDate(t)} — bu gün artıq bağlanıb`}>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatCard
            label="Olmalı idi"
            value={fmtMoney(todayClosing.expectedCash)}
          />
          <StatCard label="Sayıldı" value={fmtMoney(todayClosing.actualCash)} />
          <StatCard
            label="Fərq"
            value={fmtMoney(todayClosing.difference)}
            tone={STAT_TONE[closedDiffPresentation.tone]}
            valueIcon={
              closedDiffPresentation.showWarningIcon ? (
                <AlertTriangle size={18} aria-hidden className="shrink-0" />
              ) : (
                <Check size={18} aria-hidden className="shrink-0" />
              )
            }
            sub={closedDiffPresentation.title}
          />
        </div>
        <Row label="Başlanğıc kassa" value={fmtMoney(todayClosing.openingCash)} />
        <Row
          label="Nağd satış"
          value={`+ ${fmtMoney(todayClosing.cashSales)}`}
          tone="text-emerald-700"
        />
        <Row
          label="Günlük xərclər"
          value={`− ${fmtMoney(todayClosing.expenses)}`}
          tone="text-red-600"
        />
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
          <Lock size={16} /> Gün bağlanıb — dəyişiklik mümkün deyil.
        </div>
      </Card>
    );
  }

  // ConfirmModal.message bir <p> daxilindədir — yalnız `span` (block deyil).
  const confirmMessage = (
    <span className="block space-y-1.5">
      <ConfirmRow label="Olmalı idi" value={fmtMoney(expected)} />
      <ConfirmRow label="Sayıldı" value={fmtMoney(ac ?? 0)} />
      <ConfirmRow
        label="Fərq"
        value={fmtMoneySigned(diff ?? 0, "±")}
        tone={diffPresentation ? TONE_TEXT[diffPresentation.tone] : undefined}
      />
      <ConfirmRow label="Tarix" value={fmtDate(t)} />
      <span className="mt-3 flex items-start gap-2 rounded-chip bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-300">
        <Lock size={14} aria-hidden className="mt-0.5 shrink-0" />
        Bu qeyd dəyişdirilə bilməz — gün bağlandıqdan sonra heç bir rəqəm
        redaktə oluna bilməz.
      </span>
    </span>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title={<StepHeading n={1}>Bugünkü hesabı yoxla</StepHeading>}>
        <Field
          label="Başlanğıc kassa"
          hint="Dünənki bağlanışdan avtomatik gəlir — lazım olsa dəyişdirin."
        >
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            value={openingCash}
            onChange={(e) => {
              setTouched(true);
              setOpeningCash(e.target.value);
            }}
            className="text-right font-semibold tabular-nums"
          />
        </Field>

        <div className="mt-3">
          <Row
            label="Nağd satış"
            value={`+ ${fmtMoney(cashSales)}`}
            tone="text-emerald-700"
          />
          <Row
            label="Kart satış (kassaya düşmür)"
            value={fmtMoney(cardSales)}
            tone="text-indigo-600"
          />
          <Row
            label="Nisyə satış (kassaya düşmür)"
            value={fmtMoney(creditSales)}
            tone="text-amber-600"
          />
          <Row
            label="Günlük xərclər"
            value={`− ${fmtMoney(todayExpenses)}`}
            tone="text-red-600"
          />
          {typeof salaryExpenses === "number" && salaryExpenses > 0 && (
            <Row
              label="O cümlədən: işçi maaş ödənişləri"
              value={`− ${fmtMoney(salaryExpenses)}`}
              tone="text-red-500"
            />
          )}
        </div>

        {/* Bənd #4: hesablanan gözlənilən məbləğ QABARIQ (böyük rəqəm). */}
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Bu günün sonunda kassada olmalı
          </p>
          <p
            title={fmtMoney(expected)}
            className="money mt-1 text-3xl font-bold leading-tight text-emerald-800"
          >
            {fmtMoney(expected)}
          </p>
        </div>
      </Card>

      {!canClose ? (
        <Card title={<StepHeading n={2}>Kassadakı faktiki pulu yaz</StepHeading>}>
          <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
            <Lock size={16} /> Günü yalnız sahibkar bağlaya bilər.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          <Card
            title={<StepHeading n={2}>Kassadakı faktiki pulu yaz</StepHeading>}
          >
            <Field
              label="Faktiki sayılan pul"
              required
              hint="Kassadakı nağdı sayıb bura yazın."
            >
              <Input
                type="number"
                min="0"
                inputMode="decimal"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
              />
            </Field>
          </Card>

          <Card
            title={<StepHeading n={3}>Fərqi yoxla və günü bağla</StepHeading>}
          >
            {/*
              FE#69 (AC-12 / R-02): MÜSBƏT fərq uğur DEYİL — yoxlanmalı
              uyğunsuzluqdur. Kəhrəba fon + xəbərdarlıq ikonu + izah mətni.
              Yalnız `diff === 0` uğur rəngindədir; `diff < 0` qırmızı qalır.
              `difference()` / `expectedCash()` düsturlarına TOXUNULMAYIB.
            */}
            {diff !== null ? (
              <div
                role="status"
                className={`flex items-start gap-2.5 rounded-control px-4 py-3.5 text-sm font-bold ring-1 ${
                  diff < 0
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : diff > 0
                      ? "bg-amber-50 text-amber-900 ring-amber-300"
                      : "bg-emerald-50 text-emerald-800 ring-emerald-200"
                }`}
              >
                {diff < 0 ? (
                  <TrendingDown
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0"
                  />
                ) : diff > 0 ? (
                  <AlertTriangle
                    size={18}
                    aria-hidden
                    className="mt-0.5 shrink-0"
                  />
                ) : (
                  <Check size={18} aria-hidden className="mt-0.5 shrink-0" />
                )}
                <span className="min-w-0">
                  {diff < 0 ? (
                    `Kassada çatışmayan məbləğ: ${fmtMoney(Math.abs(diff))}`
                  ) : diff > 0 ? (
                    <>
                      {/* Etiket: E-03 (audit «Etiket və mətn dəyişiklikləri») */}
                      Kassa uyğun gəlmir — {fmtMoney(diff)} artıq çıxdı,
                      yoxlayın
                      <span className="mt-0.5 block text-xs font-medium text-amber-800">
                        Artıq məbləğ də uyğunsuzluqdur: sayımı və qeydə
                        alınmamış əməliyyatları yoxlayın.
                      </span>
                    </>
                  ) : (
                    `Kassa düz gəlir. Fərq: ${fmtMoney(0)}`
                  )}
                </span>
              </div>
            ) : (
              <p className="rounded-control bg-stone-50 px-4 py-3.5 text-sm text-stone-500 ring-1 ring-stone-200">
                Faktiki məbləği yazdıqdan sonra fərq burada canlı görünəcək.
              </p>
            )}

            {/* Bənd #9: qeyd — Closing.Note dəstəklənir, İSTƏYƏ BAĞLIDIR. */}
            <div className="mt-4">
              <Field
                label="Qeyd (istəyə bağlı)"
                hint={
                  diff !== null && diff !== 0
                    ? "Fərqin səbəbini qeyd et — məcburi deyil, amma faydalıdır."
                    : "Gün haqqında əlavə qeyd (istəyə bağlı)."
                }
              >
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Məs: 5 ₼ xırda pul çatışmazlığı — səbəbi araşdırıldı."
                />
              </Field>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full justify-center"
              disabled={!!disabledReason}
              loading={closeDay.isPending}
              onClick={() => setConfirmOpen(true)}
              icon={<Lock size={16} />}
            >
              Günü bağla
            </Button>
            {/* Bənd #7: düymə deaktivdirsə səbəb yazılır. */}
            {disabledReason && (
              <p className="mt-2 text-center text-xs font-medium text-stone-500">
                {disabledReason}
              </p>
            )}
          </Card>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doClose}
        /*
         * FE#69 senior review — `ConfirmModal` indi `onConfirm`-in Promise
         * nəticəsini gözləyir (F-43) və YALNIZ ona görə bağlanır. `doClose`
         * asinxrondur, ona görə `isPending` verilmədən düymə gözləmə zamanı
         * aktiv qalıb təkrar klikə (iki dəfə gün bağlama sorğusuna) icazə
         * verirdi — kritik/dağıdıcı əməliyyat üçün qəbuledilməzdir.
         */
        isPending={closeDay.isPending}
        error={closeError}
        title="Gün sonu bağlanışı"
        confirmText="Bəli, günü bağla"
        message={confirmMessage}
      />
    </div>
  );
}
