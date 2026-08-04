import { Banknote, TrendingUp } from "lucide-react";
import { fmtMoney } from "@/lib/format";

interface Props {
  expectedCash: number;
  openingCash: number;
  todayCash: number;
  todayExpenses: number;
  paperProfit: number;
  todayCredit: number;
}

/** İmza zolağı: real pul (kassada olmalı) vs kağız üzərində qazanc. */
export function SignatureBand({
  expectedCash,
  openingCash,
  todayCash,
  todayExpenses,
  paperProfit,
  todayCredit,
}: Props) {
  return (
    <div className="grid gap-3 rounded-2xl bg-emerald-950 p-4 sm:grid-cols-2">
      <div className="rounded-xl bg-emerald-900/60 p-4 ring-1 ring-emerald-700/50">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
          <Banknote size={14} /> Real pul — kassada olmalı
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-white">
          {fmtMoney(expectedCash)}
        </p>
        <p className="mt-1 text-xs text-emerald-200/70">
          Başlanğıc {fmtMoney(openingCash)} + nağd satış {fmtMoney(todayCash)} −
          xərc {fmtMoney(todayExpenses)}
        </p>
      </div>
      <div className="rounded-xl bg-emerald-900/60 p-4 ring-1 ring-emerald-700/50">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
          <TrendingUp size={14} /> Kağız üzərində qazanc (bu gün)
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-white">
          {fmtMoney(paperProfit)}
        </p>
        <p className="mt-1 text-xs text-emerald-200/70">
          Nisyə satışlar hələ əlinizdə deyil — bunun {fmtMoney(todayCredit)}{" "}
          hissəsi nisyədədir.
        </p>
      </div>
    </div>
  );
}
