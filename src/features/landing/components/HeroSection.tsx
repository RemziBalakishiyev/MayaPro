import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container, Eyebrow } from "./Section";
import { DashboardPreview } from "./DashboardPreview";
import { scrollToSection } from "./motion";

const TRUST = [
  "Tam Azərbaycan dilində",
  "Telefondan da işləyir",
  "Quraşdırma tələb olunmur",
];

/** Pilləli giriş: yuxarıdan aşağı 60ms addım. */
const enterAt = (delay: number) => ({ animationDelay: `${delay}ms` });

/**
 * Hero — səhifənin yeganə "ağır" vizual anı.
 *
 * Kompozisiya: solda mesaj (göz sola düşür), sağda məhsulun özü. Fon tünd
 * emerald-950-dir — brendin `theme-color`-u ilə eyni ton, ona görə səhifə
 * mobil brauzerin başlığı ilə birləşir.
 *
 * Şəkil YOXDUR: önizləmə tam CSS-dir → 0 kB şəbəkə yükü, CLS yoxdur.
 *
 * Giriş animasiyası CSS-dir (`.landing-enter`), JS vəziyyəti deyil: arxa
 * fonda açılan tabda `requestAnimationFrame` gəlmədiyi üçün məzmunun
 * görünməz qalması riski aradan qaldırılıb.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-950 pb-20 pt-28 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-40">
      {/* Fon: yuxarıdan yumşaq işıq + çox incə şəbəkə. Hər ikisi CSS-dir. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_-10%,rgba(16,185,129,0.28),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(60%_50%_at_50%_20%,black,transparent)]"
      />

      <Container className="relative">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div className="max-w-xl">
            <div className="landing-enter" style={enterAt(0)}>
              <Eyebrow tone="dark">Sədərək ticarət mərkəzi üçün</Eyebrow>
            </div>

            <h1
              className="landing-enter mt-4 text-balance text-[2.25rem] font-extrabold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
              style={enterAt(60)}
            >
              Malın, satışın və nisyə borcun{" "}
              <span className="text-emerald-300">bir ekranda</span>.
            </h1>

            <p
              className="landing-enter mt-5 text-pretty text-lg leading-relaxed text-emerald-100/80 sm:text-xl"
              style={enterAt(120)}
            >
              Dəftər və kalkulyator əvəzinə telefondan idarə et: hansı mal
              azalıb, bu gün nə qədər satılıb, kim nə qədər borcludur — hamısı
              anında görünür.
            </p>

            <div
              className="landing-enter mt-8 flex flex-col gap-3 sm:flex-row"
              style={enterAt(180)}
            >
              <Link
                to="/qeydiyyat"
                className="group focus-ring inline-flex min-h-[52px] items-center justify-center gap-2 rounded-control bg-white px-6 text-base font-bold text-emerald-900 shadow-lg shadow-emerald-950/40 transition-[background-color,transform] duration-150 hover:bg-emerald-50 active:scale-[0.99]"
              >
                Mağazanı qeydiyyatdan keçir
                <ArrowRight
                  size={18}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection("imkanlar")}
                className="focus-ring-dark inline-flex min-h-[52px] items-center justify-center rounded-control px-6 text-base font-bold text-white ring-1 ring-inset ring-white/25 transition-colors duration-150 hover:bg-white/10"
              >
                İmkanlara bax
              </button>
            </div>

            <ul
              className="landing-enter mt-8 flex flex-wrap gap-x-5 gap-y-2.5"
              style={enterAt(240)}
            >
              {TRUST.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-100/75"
                >
                  <Check
                    size={15}
                    className="shrink-0 text-emerald-400"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-enter relative" style={enterAt(220)}>
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-emerald-400/10 blur-2xl"
            />
            <DashboardPreview />
            {/* Üzən vurğu — kartın SOL kənarından kənara çıxır, məzmunu örtmür */}
            <div
              className={cn(
                "pointer-events-none absolute -bottom-6 left-0 hidden items-center gap-2.5",
                "rounded-control border border-emerald-100 bg-white px-3.5 py-2.5 shadow-panel",
                "sm:flex sm:-translate-x-6 lg:-translate-x-10",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp size={17} aria-hidden />
              </span>
              <span className="text-sm">
                <span className="block font-bold leading-tight text-stone-900">
                  Gün sonu 1 dəqiqə
                </span>
                <span className="block text-xs leading-tight text-stone-500">
                  Kassa fərqi avtomatik yoxlanılır
                </span>
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
