import {
  BarChart3,
  HandCoins,
  Lock,
  Package,
  ShoppingCart,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Container, Section, SectionHeading } from "./Section";
import { Reveal } from "./Reveal";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: Package,
    title: "Mallar və anbar",
    desc: "Qalıq, alış-satış qiyməti, rəf yeri — hamısı bir siyahıda. Mal azalanda sistem özü xəbərdarlıq edir.",
  },
  {
    icon: ShoppingCart,
    title: "Sürətli satış",
    desc: "Barkodu oxut və ya adı yaz, səbətə at, nağd / kart / nisyə ilə bağla. Qəbz elə orada hazır olur.",
  },
  {
    icon: HandCoins,
    title: "Nisyə borclar",
    desc: "Kim, nə vaxt, nə qədər aldı — hamısı yazılır. Ödəniş daxil edildikcə qalıq borc özü azalır.",
  },
  {
    icon: Lock,
    title: "Gün sonu bağlanışı",
    desc: "Kassanı bağlayanda sistemin gözlədiyi məbləğlə real nağd arasındakı fərq dərhal görünür.",
  },
  {
    icon: BarChart3,
    title: "Hesabatlar",
    desc: "Gün, həftə, ay üzrə satış, xərc və qazanc. Hansı malın nə qədər gətirdiyi rəqəmlə göstərilir.",
  },
  {
    icon: UserCog,
    title: "İşçi icazələri",
    desc: "Satıcı endirim etməsin, alış qiymətini görməsin — hər işçinin icazəsi ayrıca verilir.",
  },
];

/**
 * İmkanlar şəbəkəsi.
 *
 * Kart detalı (skill "pre-delivery" siyahısından): ikon konteyneri hover-də
 * doldurulur, kart 2px qalxır, sərhəd brend tonuna keçir — hamısı 200ms və
 * yalnız `transform` + rəng üzərində. Toxunma cihazında hover yoxdur, ona
 * görə heç bir məlumat yalnız hover-də gizlədilmir.
 */
export function FeaturesSection() {
  return (
    <Section id="imkanlar" tone="muted">
      <Container>
        <SectionHeading
          eyebrow="İmkanlar"
          title="Mağazanın bütün hesabı bir sistemdə"
          lead="Ayrı-ayrı dəftərlər, Excel faylları və yaddaş əvəzinə — bir-birinə bağlı altı bölmə."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={(i % 3) * 70} className="h-full">
              <article className="group h-full rounded-card border border-stone-200 bg-white p-6 shadow-card transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-overlay motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 transition-colors duration-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:ring-emerald-600">
                  <Icon size={22} aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold leading-snug text-stone-900">
                  {title}
                </h3>
                <p className="mt-2 text-pretty leading-relaxed text-stone-600">
                  {desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
