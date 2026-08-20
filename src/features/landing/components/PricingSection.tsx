import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Container, Section, SectionHeading } from "./Section";
import { Reveal } from "./Reveal";

const INCLUDED = [
  "Limitsiz mal və satış qeydi",
  "Nisyə borc izləməsi",
  "Gün sonu kassa bağlanışı",
  "Satış, xərc və qazanc hesabatları",
  "İşçi hesabları və icazələr",
  "Barkod və etiket çapı",
  "Telefon, planşet və kompüterdə işləmə",
  "Məlumatların gündəlik nüsxəsi",
];

/**
 * Qiymət bölməsi.
 *
 * TODO (biznes qərarı): aylıq rəqəm hələ təsdiqlənməyib — ona görə kartda
 * rəqəm YAZILMIR, əvəzinə "əlaqə" yolu göstərilir. Rəqəm təsdiqlənəndə
 * `<p>Əlaqə saxlayaq</p>` bloku qiymət + dövr sətri ilə əvəz olunur;
 * qalan kompozisiya dəyişmir.
 */
export function PricingSection() {
  return (
    <Section id="qiymet" tone="muted">
      <Container>
        <SectionHeading
          eyebrow="Qiymət"
          title="Tək plan — hər şey daxil"
          lead="Bölmələr paketlərə bölünmür. Mağazanın ölçüsünə görə şərtləri birlikdə dəqiqləşdiririk."
        />

        <Reveal className="mx-auto mt-14 max-w-xl">
          <div className="relative overflow-hidden rounded-card bg-white p-7 shadow-overlay ring-2 ring-emerald-600 sm:p-9">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(5,150,105,0.10),transparent_70%)]"
            />
            <div className="relative">
              <span className="inline-flex rounded-tag bg-emerald-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Sədərək paketi
              </span>

              <p className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-4xl">
                Əlaqə saxlayaq
              </p>
              <p className="mt-2 text-pretty leading-relaxed text-stone-600">
                Müraciəti göndər — mağazanın həcminə baxıb qiyməti və şərtləri
                sənə birbaşa deyək. Gizli ödəniş yoxdur.
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={13} strokeWidth={3} aria-hidden />
                    </span>
                    <span className="text-sm leading-snug text-stone-700">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/qeydiyyat"
                className="group focus-ring mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-control bg-emerald-700 px-6 text-base font-bold text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-emerald-800 active:scale-[0.99]"
              >
                Müraciət göndər
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </Link>
              <p className="mt-3 text-center text-sm text-stone-500">
                Müraciət dərhal ödəniş demək deyil — əvvəlcə danışırıq.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
