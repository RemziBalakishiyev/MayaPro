import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { BRAND_NAME } from "@/lib/config";
import { Container } from "./Section";
import { scrollToSection } from "./motion";

const SECTIONS = [
  { id: "imkanlar", label: "İmkanlar" },
  { id: "nece-isleyir", label: "Necə işləyir" },
  { id: "qiymet", label: "Qiymət" },
  { id: "suallar", label: "Suallar" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white py-12">
      <Container>
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Store size={18} aria-hidden />
              </span>
              <span className="text-base font-extrabold tracking-tight text-stone-900">
                {BRAND_NAME}
              </span>
            </div>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-stone-500">
              Sədərək ticarət mərkəzindəki mağazalar üçün mal, satış, borc və
              kassa idarəetməsi.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 sm:gap-x-16">
            <div className="flex flex-col gap-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-400">
                Səhifə
              </p>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className="focus-ring -mx-2 rounded-chip px-2 py-1.5 text-left text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-emerald-800"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-stone-400">
                Hesab
              </p>
              <Link
                to="/login"
                className="focus-ring -mx-2 rounded-chip px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-emerald-800"
              >
                Giriş
              </Link>
              <Link
                to="/qeydiyyat"
                className="focus-ring -mx-2 rounded-chip px-2 py-1.5 text-sm font-medium text-stone-600 transition-colors duration-150 hover:text-emerald-800"
              >
                Qeydiyyat
              </Link>
            </div>
          </nav>
        </div>

        <p className="mt-10 border-t border-stone-200 pt-6 text-sm text-stone-400">
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
      </Container>
    </footer>
  );
}
