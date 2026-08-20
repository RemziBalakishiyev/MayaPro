import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container, Section, SectionHeading } from "./Section";
import { Reveal } from "./Reveal";

const FAQ = [
  {
    q: "İnternet kəsiləndə nə olur?",
    a: "Sistem brauzerdən işləyir, ona görə internet lazımdır. Bağlantı bərpa olunanda bütün məlumat olduğu kimi yerində olur — heç nə itmir.",
  },
  {
    q: "Kompüterim yoxdur, yalnız telefonum var. İşləyəcək?",
    a: "Bəli. Ekranlar əvvəlcə telefon üçün qurulub: satış, borc yazmaq və gün sonu bağlanışı telefondan rahat edilir.",
  },
  {
    q: "Köhnə mal siyahımı necə köçürəcəm?",
    a: "Malları əl ilə əlavə edə, ya da Excel faylından yükləyə bilərsən. İlk yükləmədə sənə kömək edirik.",
  },
  {
    q: "Satıcım alış qiymətini görəcəkmi?",
    a: "Xeyr, əgər sən istəməsən. Hər işçiyə ayrıca icazə verilir: kimin endirim etməyə, kimin alış qiymətini görməyə haqqı olduğunu sən seçirsən.",
  },
  {
    q: "Məlumatlarım kimdə saxlanılır?",
    a: "Məlumat yalnız sənin mağazana bağlıdır və başqa mağazalar onu görmür. Gündəlik ehtiyat nüsxəsi götürülür.",
  },
];

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyId = useId();
  return (
    <div
      className={cn(
        "rounded-card border bg-white transition-colors duration-200",
        open ? "border-emerald-200" : "border-stone-200",
      )}
    >
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="focus-ring flex w-full items-center gap-4 rounded-card px-5 py-5 text-left transition-colors duration-150 hover:bg-stone-50"
        >
          <span className="flex-1 text-base font-bold leading-snug text-stone-900 sm:text-lg">
            {q}
          </span>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-200 motion-reduce:transition-none",
              open
                ? "rotate-180 bg-emerald-600 text-white"
                : "bg-stone-100 text-stone-500",
            )}
          >
            <ChevronDown size={17} aria-hidden />
          </span>
        </button>
      </h3>
      <div
        id={bodyId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <p className="text-pretty px-5 pb-5 leading-relaxed text-stone-600">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Etiraz və şübhələri bağlayan bölmə — açılan cavab, eyni açılış keçidi. */
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="suallar">
      <Container>
        <SectionHeading
          eyebrow="Suallar"
          title="Tez-tez verilən suallar"
          lead="Cavabı burada tapmadınsa, müraciət göndər — telefonla izah edək."
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {FAQ.map((item, i) => (
            <Reveal key={item.q} delay={Math.min(i, 3) * 60}>
              <FaqItem
                q={item.q}
                a={item.a}
                open={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
