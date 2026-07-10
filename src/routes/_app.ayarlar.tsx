import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
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
  const update = useSettingsStore((s) => s.update);

  const [f, setF] = useState<Settings>({
    storeName: settings.storeName,
    ownerName: settings.ownerName,
    whatsappTemplate: settings.whatsappTemplate,
    currency: settings.currency,
    defaultMinStock: settings.defaultMinStock,
    language: settings.language,
  });

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    update({
      ...f,
      defaultMinStock: Number(f.defaultMinStock) || 0,
    });
    toast.success("Ayarlar yadda saxlandı");
  };

  return (
    <div>
      <PageHead
        title="Ayarlar"
        subtitle="Mağaza və sistem parametrləri"
        actions={
          <Button size="sm" icon={<Check size={14} />} onClick={save}>
            Yadda saxla
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
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
            Rol əsaslı icazələr backend ilə aktivləşəcək.
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
      </div>
    </div>
  );
}
