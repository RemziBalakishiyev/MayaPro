import { Container, Section, SectionHeading } from "./Section";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    title: "Qeydiyyatdan keç",
    desc: "Mağazanın adını, sahibin adını və telefon nömrəsini yaz. İki dəqiqəlik işdir.",
  },
  {
    title: "Təsdiqi gözlə",
    desc: "Müraciətin yoxlanılır. Təsdiqdən sonra girişin açılır və sənə xəbər verilir.",
  },
  {
    title: "Malları yüklə, işə başla",
    desc: "Malları əlavə et və elə həmin gün satışı, borcu, kassanı sistemdən apar.",
  },
];

/** Üç addım — prosesi qeyri-müəyyənlikdən çıxarır (qeydiyyat → təsdiq → iş). */
export function HowItWorksSection() {
  return (
    <Section id="nece-isleyir">
      <Container>
        <SectionHeading
          eyebrow="Necə işləyir"
          title="Üç addım, bir gün"
          lead="Nə server lazımdır, nə də quraşdırma. Telefon və ya kompüterdən brauzerlə açılır."
        />

        <ol className="relative mt-14 grid gap-8 sm:gap-6 md:grid-cols-3">
          {/* Addımları birləşdirən incə xətt — yalnız geniş ekranda */}
          <li
            aria-hidden
            className="absolute left-[16.6%] right-[16.6%] top-6 hidden border-t-2 border-dashed border-stone-200 md:block"
          />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <Reveal delay={i * 80}>
                <div className="flex flex-col items-start gap-4 md:items-center md:text-center">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-lg font-extrabold text-white ring-8 ring-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-xs text-pretty leading-relaxed text-stone-600">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
