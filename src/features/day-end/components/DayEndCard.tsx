import { useEffect, useMemo, useState } from "react";
import { Check, Lock, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { StatCard } from "@/components/ui/StatCard";
import { useToast } from "@/components/ui/toast-store";
import { fmtMoney, fmtDate, todayISO } from "@/lib/format";
import { useSummary } from "@/features/reports/queries";
import { useCan } from "@/features/auth/store";
import { useClosings, useTodayClosing, useCloseDay } from "../queries";
import { expectedCash as calcExpected, difference as calcDiff } from "../lib";

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

export function DayEndCard() {
  const toast = useToast();
  const t = todayISO();
  // Gün cəmləri serverdən (mock rejimdə mock summary) — GET /api/reports/summary?period=today
  const { data: summary } = useSummary("today");
  const { data: closings = [] } = useClosings();
  const { data: todayClosing } = useTodayClosing();
  const closeDay = useCloseDay();
  const canClose = useCan()("closings.write");

  const [openingCash, setOpeningCash] = useState("");
  const [touched, setTouched] = useState(false);
  const [actualCash, setActualCash] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cashSales = summary?.cashSales ?? 0;
  const cardSales = summary?.cardSales ?? 0;
  const creditSales = summary?.creditSales ?? 0;
  const todayExpenses = summary?.expenses ?? 0;

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

  const doClose = async () => {
    try {
      // Server yalnız openingCash/actualCash/note qəbul edir; cəmləri özü hesablayır.
      await closeDay.mutateAsync({
        openingCash: oc,
        actualCash: ac ?? expected,
      });
      toast.success("Gün sonu bağlandı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bağlanış alınmadı");
    }
  };

  // Bugün artıq bağlanıbsa → xülasə kartı
  if (todayClosing) {
    return (
      <Card title={`${fmtDate(t)} — bu gün artıq bağlanıb`}>
        <div className="mb-4 grid grid-cols-3 gap-2">
          <StatCard
            label="Gözlənilən"
            value={fmtMoney(todayClosing.expectedCash)}
          />
          <StatCard label="Faktiki" value={fmtMoney(todayClosing.actualCash)} />
          <StatCard
            label="Fərq"
            value={fmtMoney(todayClosing.difference)}
            tone={
              todayClosing.difference < 0
                ? "red"
                : todayClosing.difference > 0
                  ? "green"
                  : "default"
            }
          />
        </div>
        <Row label="Başlanğıc kassa" value={fmtMoney(todayClosing.openingCash)} />
        <Row
          label="Nağd satış"
          value={`+ ${fmtMoney(todayClosing.cashSales)}`}
          tone="text-emerald-700"
        />
        <Row
          label="Günlük xərclər"
          value={`− ${fmtMoney(todayClosing.expenses)}`}
          tone="text-red-600"
        />
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
          <Lock size={16} /> Gün bağlanıb — dəyişiklik mümkün deyil.
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Bugünkü hesab">
        <Row
          label="Başlanğıc kassa"
          value={
            <input
              type="number"
              value={openingCash}
              onChange={(e) => {
                setTouched(true);
                setOpeningCash(e.target.value);
              }}
              className="w-28 rounded-lg border border-stone-300 px-2 py-1 text-right text-sm font-semibold tabular-nums focus:border-emerald-600 focus:outline-none"
            />
          }
        />
        <Row
          label="Nağd satış"
          value={`+ ${fmtMoney(cashSales)}`}
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
          value={`− ${fmtMoney(todayExpenses)}`}
          tone="text-red-600"
        />
        <Row
          label="Kassada olmalı məbləğ"
          value={fmtMoney(expected)}
          bold
          tone="text-emerald-800"
        />
      </Card>

      {!canClose ? (
        <Card title="Faktiki sayım">
          <div className="flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
            <Lock size={16} /> Günü yalnız sahibkar bağlaya bilər.
          </div>
        </Card>
      ) : (
      <Card title="Faktiki sayım">
        <Field
          label="Faktiki sayılan pul"
          required
          hint="Kassadakı nağdı sayıb bura yazın."
        >
          <Input
            type="number"
            min="0"
            value={actualCash}
            onChange={(e) => setActualCash(e.target.value)}
            placeholder="0.00"
          />
        </Field>

        {diff !== null && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3.5 text-sm font-bold ring-1 ${
              diff < 0
                ? "bg-red-50 text-red-700 ring-red-200"
                : diff > 0
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  : "bg-stone-50 text-stone-700 ring-stone-200"
            }`}
          >
            {diff < 0 ? (
              <TrendingDown size={18} />
            ) : diff > 0 ? (
              <TrendingUp size={18} />
            ) : (
              <Check size={18} />
            )}
            {diff < 0
              ? `Kassada çatışmayan məbləğ: ${fmtMoney(Math.abs(diff))}`
              : diff > 0
                ? `Kassada artıq məbləğ: ${fmtMoney(diff)}`
                : "Kassa düz gəlir. Fərq: 0.00 AZN"}
          </div>
        )}

        <Button
          size="lg"
          className="mt-4 w-full justify-center"
          disabled={ac === null || closeDay.isPending}
          onClick={() => setConfirmOpen(true)}
          icon={<Lock size={16} />}
        >
          Günü bağla
        </Button>
      </Card>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doClose}
        title="Gün sonu bağlanışı"
        confirmText="Bəli, günü bağla"
        message={`Kassada olmalı: ${fmtMoney(expected)}. Sayılan: ${fmtMoney(
          ac ?? 0,
        )}. Fərq: ${fmtMoney(diff ?? 0)}. Gün bağlandıqdan sonra dəyişiklik olmayacaq.`}
      />
    </div>
  );
}
