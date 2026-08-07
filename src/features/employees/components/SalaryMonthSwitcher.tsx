import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatSalaryMonth,
  isFutureSalaryMonth,
  shiftSalaryMonth,
} from "../lib";

interface Props {
  month: string;
  onChange: (month: string) => void;
  /** Kiçik variant — drawer içindəki ay dəyişmə üçün. */
  size?: "md" | "sm";
}

/** Ay göstərgəsi + əvvəl/sonrakı — maaş ay hesabı olduğu üçün gündəlik filtr yoxdur. */
export function SalaryMonthSwitcher({ month, onChange, size = "md" }: Props) {
  const nextDisabled = isFutureSalaryMonth(shiftSalaryMonth(month, 1));
  return (
    <div
      className={
        size === "md"
          ? "inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1"
          : "inline-flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white p-0.5"
      }
    >
      <button
        type="button"
        aria-label="Əvvəlki ay"
        title="Əvvəlki ay"
        onClick={() => onChange(shiftSalaryMonth(month, -1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-[112px] px-1 text-center text-sm font-bold text-stone-800">
        {formatSalaryMonth(month)}
      </span>
      <button
        type="button"
        aria-label="Sonrakı ay"
        title={nextDisabled ? "Gələcək ay seçilə bilməz" : "Sonrakı ay"}
        disabled={nextDisabled}
        onClick={() => onChange(shiftSalaryMonth(month, 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
