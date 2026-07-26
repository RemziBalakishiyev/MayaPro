import { Phone } from "lucide-react";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { formatPhoneDisplay, phoneDigits } from "@/lib/phone";

async function copyPhone(phone: string): Promise<boolean> {
  const digits = phoneDigits(phone);
  if (!digits) return false;
  const text = `+${digits}`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Zəng düyməsi + klikləyəndə kopyalanan nömrə. */
export function CopyablePhone({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  const toast = useToast();
  const digits = phoneDigits(phone);
  const display = formatPhoneDisplay(phone) || phone;

  if (!digits) {
    return <span className={className}>—</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`tel:+${digits}`}
        title="Zəng et"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50"
      >
        <Phone size={13} />
      </a>
      <button
        type="button"
        title="Kopyalamaq üçün klikləyin"
        onClick={async (e) => {
          e.stopPropagation();
          const ok = await copyPhone(phone);
          if (ok) toast.success("Nömrə kopyalandı");
          else toast.error("Nömrə kopyalanmadı");
        }}
        className={cn(
          "text-left tabular-nums underline-offset-2 hover:text-emerald-700 hover:underline",
          className ?? "text-xs text-stone-600",
        )}
      >
        {display}
      </button>
    </span>
  );
}
