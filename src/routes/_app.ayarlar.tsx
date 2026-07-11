import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Lock } from "lucide-react";
import { PageHead } from "@/components/layout/PageHead";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/toast-store";
import { useSettingsStore, type Settings } from "@/features/settings/store";
import { useSettings, useUpdateSettings } from "@/features/settings/queries";
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

  const [f, setF] = useState<Settings>({
    storeName: settings.storeName,
    ownerName: settings.ownerName,
    whatsappTemplate: settings.whatsappTemplate,
    currency: settings.currency,
    defaultMinStock: settings.defaultMinStock,
    language: settings.language,
  });

  // Serverdən ayarlar gələndə formu yenilə (mənbə = API).
  useEffect(() => {
    if (server) setF({ ...server });
  }, [server]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    try {
      await updateSettings.mutateAsync({
        ...f,
        defaultMinStock: Number(f.defaultMinStock) || 0,
      });
      toast.success("Ayarlar yadda saxlandı");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Yadda saxlanmadı");
    }
  };

  return (
    <div>
      <PageHead
        title="Ayarlar"
        subtitle="Mağaza və sistem parametrləri"
        actions={
          canEdit && (
            <Button
              size="sm"
              icon={<Check size={14} />}
              onClick={save}
              disabled={updateSettings.isPending}
            >
              Yadda saxla
            </Button>
          )
        }
      />

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
            <Field label="Mağaza adı">
              <Input
                value={f.storeName}
                onChange={(e) => set("storeName", e.target.value)}
              />
            </Field>
            <Field label="Sahibkar adı">
              <Input
                value={f.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
              />
            </Field>
            <Field
              label="WhatsApp borc xatırlatma şablonu"
              hint="{debt} yazdığınız yerə borc məbləği (məs. 250.00) əlavə olunacaq."
            >
              <Textarea
                rows={3}
                value={f.whatsappTemplate}
                onChange={(e) => set("whatsappTemplate", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card title="Sistem parametrləri">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Default valyuta" hint="Digər valyutalar tezliklə">
                <Select value={f.currency} disabled>
                  <option>AZN</option>
                </Select>
              </Field>
              <Field label="Minimum stok (default)">
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
            <Field label="Dil" hint="Hazırda yalnız Azərbaycanca">
              <Select value="az" disabled>
                <option value="az">Azərbaycanca</option>
              </Select>
            </Field>
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
    </div>
  );
}
