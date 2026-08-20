import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "./Section";
import { Reveal } from "./Reveal";

/** Son çağırış — hero ilə eyni tünd ton, səhifəni qapayan tək qərar. */
export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-emerald-950 py-20 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_120%,rgba(16,185,129,0.25),transparent_70%)]"
      />
      <Container className="relative">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl">
            Bu gündən hesabı dəftərdə deyil, sistemdə tut
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-emerald-100/80">
            Qeydiyyat iki dəqiqə çəkir. Təsdiqdən sonra mağazan hazırdır.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
            <Link
              to="/login"
              className="focus-ring-dark inline-flex min-h-[52px] items-center justify-center rounded-control px-6 text-base font-bold text-white ring-1 ring-inset ring-white/25 transition-colors duration-150 hover:bg-white/10"
            >
              Hesabım var, giriş
            </Link>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
