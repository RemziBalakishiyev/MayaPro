import { Phone } from "lucide-react";
import { useToast } from "@/components/ui/toast-store";
import { cn } from "@/lib/cn";
import { formatPhoneDisplay, toStoredPhone } from "@/lib/phone";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Zəng düyməsi + klikləyəndə kopyalanan nömrə.
 * Nömrə həmişə `toStoredPhone` ilə normallaşdırılır (994XXXXXXXXX), belə ki
 * "050...", "+994...", "994..." formatlarının hamısı düzgün `tel:` linki verir.
 *
 * FE#63 — telefonu olmayan müştəri sətrində "—" əvəzinə heç nə göstərilmir
 * (boş xana): telefonsuzluq faktı əhəmiyyətsiz "naməlum dəyər" kimi
 * vurğulanmasın deyə.
 */
export function CopyablePhone({
  phone,
  className,
}: {
  phone: string;
  className?: string;
}) {
  const toast = useToast();
  const stored = toStoredPhone(phone);

  if (!stored) {
    return null;
  }

  const display = formatPhoneDisplay(phone);

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={`tel:+${stored}`}
        title="Zəng et"
        aria-label={`Zəng et: ${display}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <Phone size={13} aria-hidden="true" />
      </a>
      <button
        type="button"
        title="Kopyalamaq üçün klikləyin"
        aria-label={`${display} — kopyala`}
        onClick={async (e) => {
          e.stopPropagation();
          const ok = await copyText(`+${stored}`);
          if (ok) toast.success("Nömrə kopyalandı");
          else toast.error("Nömrə kopyalanmadı");
        }}
        className={cn(
          "inline-flex min-h-[40px] items-center rounded text-left tabular-nums underline-offset-2 hover:text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          className ?? "text-xs text-stone-600",
        )}
      >
        {display}
      </button>
    </span>
  );
}
