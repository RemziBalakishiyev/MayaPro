import { useEffect, useRef, useState } from "react";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { Lock, MessageCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/toast-store";
import { useSettingsStore, type Settings } from "@/features/settings/store";
import { useSettings, useUpdateSettings } from "@/features/settings/queries";
import {
  areSettingsEqual,
  buildWhatsappPreview,
  validateSettings,
  type SettingsFieldErrors,
} from "@/features/settings/lib";
import { useCan } from "@/features/auth/store";

const PERMS = [
  {
    role: "Sahibkar",
    desc: "Hər şeyə tam icazə: satış, mal, borc, gün sonu, hesabatlar, ayarlar.",
  },
  {
    role: "Menecer",
    desc: "Satış, mal, borc və gün sonu. Ayarlara giriş yoxdur.",
  },
  {
    role: "Satıcı",
    desc: "Yalnız satış edə bilər. Endirim üçün menecer təsdiqi lazımdır.",
  },
];

export const Route = createFileRoute("/_app/ayarlar")({
  component: AyarlarPage,
});

function AyarlarPage() {
  const toast = useToast();
  const settings = useSettingsStore();
  const { data: server } = useSettings();
  const updateSettings = useUpdateSettings();
  const canEdit = useCan()("settings.write");

  const initial: Settings = {
    storeName: settings.storeName,
    ownerName: settings.ownerName,
    address: settings.address,
    phone: settings.phone,
    whatsappTemplate: settings.whatsappTemplate,
    currency: settings.currency,
    defaultMinStock: settings.defaultMinStock,
    language: settings.language,
  };

  // `f` — cari draft (yadda saxlanılmamış ola bilər). `baseline` — sonuncu
  // bilinən saxlanmış vəziyyət (server və ya son uğurlu save). Bənd 6/7.
  const [f, setF] = useState<Settings>(initial);
  const [baseline, setBaseline] = useState<Settings>(initial);
  const [errors, setErrors] = useState<SettingsFieldErrors>({});

  const dirty = !areSettingsEqual(f, baseline);
  const dirtyRef = useRef(dirty);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  // Serverdən ayarlar gələndə mənbə API-dır — LAKİN yadda saxlanılmamış
  // dəyişiklik varsa draft üzərinə YAZILMIR (arxa-fon refetch itki yaratmasın).
  useEffect(() => {
    if (!server) return;
    setBaseline(server);
    setF((prev) => (dirtyRef.current ? prev : { ...server }));
  }, [server]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const cancel = () => {
    setF(baseline);
    setErrors({});
  };

  const save = async () => {
    const nextErrors = validateSettings(f);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    try {
      const payload: Settings = {
        ...f,
        defaultMinStock: Number(f.defaultMinStock) || 0,
      };
      await updateSettings.mutateAsync(payload);
      setBaseline(payload);
      setF(payload);
      setErrors({});
      toast.success("Ayarlar yadda saxlandı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yadda saxlanmadı");
    }
  };

  // Bənd 15 — TanStack Router naviqasiya bloklaması: yadda saxlanılmamış
  // dəyişikliklə səhifədən çıxışda (link/geri) təsdiq istənir; brauzer
  // tab bağlanması/yenilənməsi üçün `enableBeforeUnload`.
  const blocker = useBlocker({
    shouldBlockFn: () => dirty,
    enableBeforeUnload: dirty,
    withResolver: true,
  });

  const preview = buildWhatsappPreview(f.whatsappTemplate);

  return (
    <div className="pb-6">
      <PageHeader title="Ayarlar" subtitle="Mağaza və sistem parametrləri" />

      {!canEdit && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
          <Lock size={16} /> Ayarları yalnız sahibkar dəyişə bilər.
        </div>
      )}

      <fieldset
        disabled={!canEdit}
        className="m-0 grid gap-5 border-0 p-0 lg:grid-cols-2"
      >
        <Card title="Mağaza məlumatları">
          <div className="space-y-3">
            <Field label="Mağaza adı" required error={errors.storeName}>
              <Input
                value={f.storeName}
                maxLength={200}
                onChange={(e) => set("storeName", e.target.value)}
              />
            </Field>
            <Field label="Sahibkar adı" error={errors.ownerName}>
              <Input
                value={f.ownerName}
                maxLength={200}
                onChange={(e) => set("ownerName", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Qaimə məlumatları">
          <div className="space-y-3">
            <Field
              label="Ünvan"
              hint="Qaimə başlığında görünəcək"
              error={errors.address}
            >
              <Input
                value={f.address}
                maxLength={300}
                placeholder="Məs. Sədərək TM, blok 3, mağaza 214"
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field
              label="Telefon"
              hint="Qaimə başlığında görünəcək"
              error={errors.phone}
            >
              <Input
                type="tel"
                value={f.phone}
                maxLength={30}
                placeholder="Məs. +994 50 123 45 67"
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Pul və stok parametrləri">
          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-stone-700">
                Valyuta
              </span>
              <p className="text-base text-stone-800">
                {f.currency}{" "}
                <span className="text-sm text-stone-500">
                  (tezliklə əlavə valyutalar)
                </span>
              </p>
            </div>
            <Field
              label="Minimum stok (default)"
              error={errors.defaultMinStock}
            >
              <Input
                type="number"
                min="0"
                value={f.defaultMinStock}
                onChange={(e) =>
                  set("defaultMinStock", Number(e.target.value))
                }
              />
            </Field>
          </div>
        </Card>

        <Card title="Dil">
          <div>
            <p className="text-base text-stone-800">
              Azərbaycanca{" "}
              <span className="text-sm text-stone-500">
                (tezliklə əlavə dillər)
              </span>
            </p>
          </div>
        </Card>

        <Card title="WhatsApp borc xatırlatma şablonu" className="lg:col-span-2">
          <div className="space-y-3">
            <Field
              label="Şablon"
              required
              hint="{debt} yazdığınız yerə borc məbləği (məs. 250.00) əlavə olunacaq."
              error={errors.whatsappTemplate}
            >
              <Textarea
                rows={3}
                maxLength={1000}
                value={f.whatsappTemplate}
                onChange={(e) => set("whatsappTemplate", e.target.value)}
              />
            </Field>

            {/* Canlı önizləmə — dəyişdikcə ekran oxuyucusu da eşitsin
                (mövcud naxış: PaymentConfirmModal `RemainingBanner`). */}
            <div
              role="status"
              aria-live="polite"
              className="rounded-control border border-dashed border-stone-300 bg-stone-50 px-4 py-3"
            >
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-stone-500">
                <MessageCircle size={13} aria-hidden /> Önizləmə (nümunə
                borc: 250.00 AZN)
              </p>
              <p className="text-sm text-stone-700">
                {preview || "Şablon boşdur"}
              </p>
            </div>
          </div>
        </Card>

        <Card title="İşçi icazələri" className="lg:col-span-2">
          <p className="mb-3 text-xs text-stone-400">
            Rol əsaslı icazələr aktivdir — backend hər əməliyyatı rola görə
            yoxlayır.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {PERMS.map((p) => (
              <div
                key={p.role}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4"
              >
                <Badge>{p.role}</Badge>
                <p className="mt-2 text-sm text-stone-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </fieldset>

      {canEdit && dirty && (
        <div className="sticky bottom-0 z-10 -mx-4 -mb-28 mt-5 border-t border-stone-200 bg-white px-4 py-3 shadow-panel lg:-mx-8 lg:-mb-10 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p
              role="status"
              aria-live="polite"
              className="text-sm font-semibold text-stone-700"
            >
              Dəyişikliklər yadda saxlanılmayıb
            </p>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant="secondary"
                className="flex-1 sm:flex-none"
                onClick={cancel}
                disabled={updateSettings.isPending}
              >
                Ləğv et
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={save}
                loading={updateSettings.isPending}
              >
                Yadda saxla
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={blocker.status === "blocked"}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Yadda saxlanmamış dəyişikliklər"
        message="Bu səhifədən çıxsanız, yadda saxlanmamış dəyişiklikləriniz itəcək. Davam etmək istəyirsiniz?"
        confirmText="Bəli, çıx"
        danger
      />
    </div>
  );
}
