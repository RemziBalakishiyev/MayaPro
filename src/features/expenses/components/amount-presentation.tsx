import { ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { fmtMoney } from "@/lib/format";

/**
 * FE#76 (AC-5..AC-8) — xərc məbləğinin VAHİD, NEYTRAL təqdimatı.
 *
 * Əvvəl 4 yerdə (cədvəl sətri, mobil kart, drawer başlığı, cəm xülasəsi)
 * `text-red-600` + manual "−" prefiksi var idi — xərc gündəlik NORMAL
 * əməliyyatdır, ziyan/kritik DEYİL (`docs/design-system.md` rəng qaydası:
 * qırmızı YALNIZ dağıdıcı əməliyyat/ziyan/kritik problem üçün). Bu modul
 * hər yerdə eyni funksiyanı təqdim edir ki, 4 yer arasında format sürüşməsin.
 *
 * Rəqəm İŞARƏSİZdir (`fmtMoney`, "-123.00" DEYİL, "123.00 ₼") və rəng
 * neytraldır (`text-stone-900`). "Kassadan çıxış" konteksti rənglə DEYİL,
 * kiçik boz ikon+mətn ilə verilir — rəng "yeganə status siqnalı" olmasın
 * qaydasına da uyğundur (design-system.md §1.8).
 *
 * DİQQƏT: bu, YALNIZ təqdimatdır — `Expense.amount` saxlanan dəyəri və
 * `expenseCostImpactPerUnit` hesablaması (`../lib.ts`) buradan istifadə
 * OLUNMUR, toxunulmayıb.
 */

const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "text-sm font-bold",
  md: "text-lg font-bold",
  lg: "text-2xl font-extrabold",
};

/** Kiçik boz "çıxış" konteksti — rəqəmin yanında, rəng SİQNAL DEYİL. */
export function ExpenseOutflowTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-stone-400",
        className,
      )}
      title="Kassadan çıxış"
    >
      <ArrowDownRight size={12} aria-hidden="true" />
      çıxış
    </span>
  );
}

interface ExpenseAmountProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** İşarəsiz, neytral rəqəm + kiçik "çıxış" konteksti — tək mənbə. */
export function ExpenseAmount({
  amount,
  size = "sm",
  className,
}: ExpenseAmountProps) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
        className,
      )}
    >
      {/* Ekran oxuyucusu üçün: tək başına rəqəm mənasızdır (`aria-label` —
          nəzərə çarpan mətni ayrıca sr-only mətn node-una bölmədən). */}
      <span
        className={cn("tabular-nums text-stone-900", SIZE_CLASS[size])}
        aria-label={`Xərc məbləği: ${fmtMoney(amount)}`}
      >
        {fmtMoney(amount)}
      </span>
      <ExpenseOutflowTag />
    </span>
  );
}
