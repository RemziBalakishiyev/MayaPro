import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Clock, Lock, CalendarClock, ShieldAlert, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WhatsAppNotifyButton } from "@/features/auth/components/WhatsAppNotifyButton";
import { getLastLoginPhone } from "@/features/auth/lastLoginPhone";

const searchSchema = z.object({
  reason: z
    .enum(["PendingApproval", "Blocked", "SubscriptionExpired"])
    .optional(),
  message: z.string().optional(),
});

export const Route = createFileRoute("/hesab-bloklu")({
  validateSearch: searchSchema,
  component: AccessBlockedPage,
});

interface ReasonMeta {
  icon: LucideIcon;
  title: string;
  hint: string;
  tone: string;
}

const REASON_META: Record<
  "PendingApproval" | "Blocked" | "SubscriptionExpired",
  ReasonMeta
> = {
  PendingApproval: {
    icon: Clock,
    title: "Hesabınız təsdiq gözləyir",
    hint: "Müraciətiniz qəbul olunub — mağazanız platforma administratoru tərəfindən təsdiqləndikdən sonra sizə xəbər veriləcək.",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  Blocked: {
    icon: Lock,
    title: "Hesabınıza giriş bloklanıb",
    hint: "Mağazanızın girişi platforma administratoru tərəfindən dayandırılıb.",
    tone: "bg-red-50 text-red-700 ring-red-200",
  },
  SubscriptionExpired: {
    icon: CalendarClock,
    title: "Abunə müddətiniz bitib",
    hint: "Ödənişdən sonra sistem avtomatik açılacaq.",
    tone: "bg-orange-50 text-orange-700 ring-orange-200",
  },
};

const FALLBACK_META: ReasonMeta = {
  icon: ShieldAlert,
  title: "Girişiniz məhdudlaşdırılıb",
  hint: "Zəhmət olmasa yenidən daxil olmağa çalışın; problem davam edərsə platforma administratoru ilə əlaqə saxlayın.",
  tone: "bg-stone-100 text-stone-700 ring-stone-200",
};

/** Mesaj mətnindən (məs. "... əlaqə: 994501112233") telefon nömrəsini çıxarır. */
function extractPhone(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(/[+0-9][\d\s()-]{6,}\d/);
  return match ? match[0].trim() : null;
}

export function AccessBlockedPage() {
  const { reason, message } = Route.useSearch();
  const meta = reason ? REASON_META[reason] : FALLBACK_META;
  const Icon = meta.icon;
  const phone = extractPhone(message);
  // FE#190 — yalnız təsdiq gözləyən istifadəçiyə (öz cəhdinin nömrəsi ilə)
  // WhatsApp bildiriş düyməsi göstərilir.
  const loginPhone = reason === "PendingApproval" ? getLastLoginPhone() : "";

  return (
    <div className="flex min-h-full items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ring-1 ${meta.tone}`}
        >
          <Icon size={26} aria-hidden />
        </div>

        <h1 className="text-xl font-bold text-stone-900">{meta.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          {meta.hint}
        </p>

        {message && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700 ring-1 ring-stone-200"
          >
            {message}
          </div>
        )}

        {phone && (
          <a
            href={`tel:+${phone.replace(/\D/g, "")}`}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-control bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
          >
            <Phone size={16} aria-hidden />
            Admin ilə əlaqə: {phone}
          </a>
        )}

        {reason === "PendingApproval" && (
          <WhatsAppNotifyButton phone={loginPhone} />
        )}

        <Link to="/login" className="mt-6 block">
          <Button variant="secondary" className="w-full justify-center">
            Girişə qayıt
          </Button>
        </Link>
      </div>
    </div>
  );
}
