import { AlertTriangle, HandCoins, ShoppingCart, Wallet } from "lucide-react";
import { fmtMoney } from "@/lib/format";

const KPI = [
  { label: "Bugünkü satış", value: 1250, icon: ShoppingCart, tone: "emerald" },
  { label: "Nisyə borc", value: 340, icon: HandCoins, tone: "amber" },
  { label: "Kassada olmalı", value: 910, icon: Wallet, tone: "stone" },
] as const;

/** Son 7 günün nisbi satış hündürlükləri (yalnız təqdimat). */
const BARS = [42, 58, 35, 71, 64, 88, 76];

const TONE: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  stone: "bg-stone-100 text-stone-600",
};

/**
 * Məhsulun statik önizləməsi — screenshot DEYİL, tam CSS/SVG-siz markup.
 *
 * Səbəb (performans sərhədi): şəkil = əlavə şəbəkə sorğusu + CLS riski +
 * mobil dekodlama. Burada 0 kB əlavə yük var və rəqəmlər sistemin öz
 * `fmtMoney()` formatındadır ki, real ekranla eyni görünsün.
 */
export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="relative rounded-[1.25rem] border border-white/15 bg-white/10 p-2 shadow-panel backdrop-blur-sm"
    >
      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
              Ana səhifə
            </p>
            <p className="text-base font-extrabold text-stone-900">
              Bu günün mənzərəsi
            </p>
          </div>
          <span className="rounded-tag bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
            Canlı
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {KPI.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-2.5"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}
              >
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-stone-600">
                {label}
              </span>
              <span className="tabular-nums text-base font-extrabold text-stone-900">
                {fmtMoney(value)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 px-3 pb-3 pt-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-stone-400">
            Son 7 gün
          </p>
          <div className="mt-2.5 flex h-16 items-end gap-1.5">
            {BARS.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t-[3px] ${
                  i === BARS.length - 1 ? "bg-emerald-600" : "bg-emerald-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-200">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <p className="text-sm font-semibold text-amber-900">
            3 malın qalığı azalıb
          </p>
        </div>
      </div>
    </div>
  );
}
