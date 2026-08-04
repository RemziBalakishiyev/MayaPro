import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onStep: (delta: number) => void;
  min?: number;
  max?: number;
  /** Daha böyük kassa ölçüsü (defolt yığcam). */
  size?: "sm" | "lg";
  className?: string;
}

/** Yığcam [−] input [+] qrupu — bitişik, iki uca dağılmır. */
export function QtyStepper({
  value,
  onChange,
  onStep,
  min = 1,
  max = Infinity,
  size = "sm",
  className,
}: Props) {
  const n = Number(value) || 0;
  const lg = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex w-full max-w-[180px] items-stretch overflow-hidden rounded-xl border border-stone-300 bg-white",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={n <= min}
        aria-label="Azalt"
        className={cn(
          "flex shrink-0 items-center justify-center bg-stone-100 text-stone-700 active:bg-stone-200 disabled:opacity-40",
          lg ? "h-12 w-12" : "h-11 w-11",
        )}
      >
        <Minus size={lg ? 22 : 18} />
      </button>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
        inputMode="numeric"
        className={cn(
          "min-w-0 flex-1 border-x border-stone-300 bg-transparent text-center font-bold tabular-nums text-stone-900 outline-none",
          lg ? "h-12 text-xl" : "h-11 text-lg",
        )}
      />
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={n >= max}
        aria-label="Artır"
        className={cn(
          "flex shrink-0 items-center justify-center bg-emerald-600 text-white active:bg-emerald-700 disabled:opacity-40",
          lg ? "h-12 w-12" : "h-11 w-11",
        )}
      >
        <Plus size={lg ? 22 : 18} />
      </button>
    </div>
  );
}
