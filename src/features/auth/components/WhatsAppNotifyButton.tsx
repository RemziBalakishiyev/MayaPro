import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { buildRegistrationWhatsAppUrl } from "../whatsapp";

interface Props {
  /** Mağaza adı — yoxdursa (məs. pending/login ekranı) mesaj sadələşir. */
  storeName?: string;
  /** RAW telefon (məs. "994501234567") — boşdursa düymə göstərilmir. */
  phone: string;
}

/**
 * FE#190 — qeydiyyat "qəbul olundu" və "təsdiq gözləyir" ekranlarında ortaq
 * istifadə olunan böyük yaşıl WhatsApp bildiriş düyməsi.
 */
export function WhatsAppNotifyButton({ storeName = "", phone }: Props) {
  if (!phone) return null;
  const url = buildRegistrationWhatsAppUrl(storeName, phone);

  return (
    <div className="mt-6">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="focus-ring flex min-h-[52px] w-full items-center justify-center gap-2 rounded-control bg-[#25D366] px-6 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#1eba57] active:scale-[0.99] active:bg-[#15954a]"
      >
        <WhatsAppIcon size={20} aria-hidden />
        WhatsApp-la qeydiyyatını bildir
      </a>
      <p className="mt-2 text-center text-xs text-stone-500">
        Bir mesajla admin qeydiyyatını görüb təsdiqləyəcək
      </p>
    </div>
  );
}
