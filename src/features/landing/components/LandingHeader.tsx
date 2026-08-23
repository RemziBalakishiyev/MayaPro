import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Store, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { BRAND_NAME } from "@/lib/config";
import { Container } from "./Section";
import { scrollToSection } from "./motion";

const NAV = [
  { id: "imkanlar", label: "İmkanlar" },
  { id: "nece-isleyir", label: "Necə işləyir" },
  { id: "qiymet", label: "Qiymət" },
  { id: "suallar", label: "Suallar" },
];

/**
 * Yapışqan başlıq: hero-nun tünd fonunda şəffaf başlayır, ilk sürüşmədən
 * sonra ağ + blur səthə keçir. Yeganə "scroll effekti" budur — sərhəd və fon
 * dəyişikliyi 200ms, heç bir layout hərəkəti yoxdur.
 */
export function LandingHeader() {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        solid || menuOpen
          ? "border-b border-stone-200 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="focus-ring -ml-1 flex items-center gap-2.5 rounded-chip px-1 py-1"
        >
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-colors duration-200",
              solid || menuOpen
                ? "bg-emerald-700 text-white"
                : "bg-white/10 text-emerald-300 ring-1 ring-white/20",
            )}
          >
            <Store size={18} aria-hidden />
          </span>
          <span
            className={cn(
              "text-base font-extrabold tracking-tight transition-colors duration-200",
              solid || menuOpen ? "text-stone-900" : "text-white",
            )}
          >
            {BRAND_NAME}
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                "focus-ring rounded-chip px-3 py-2 text-sm font-semibold transition-colors duration-150",
                solid
                  ? "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  : "text-emerald-100/80 hover:bg-white/10 hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className={cn(
              "focus-ring hidden min-h-[40px] items-center rounded-chip px-3.5 text-sm font-semibold transition-colors duration-150 sm:inline-flex",
              solid || menuOpen
                ? "text-stone-700 hover:bg-stone-100"
                : "text-white hover:bg-white/10",
            )}
          >
            Giriş
          </Link>
          <Link
            to="/qeydiyyat"
            className="focus-ring inline-flex min-h-[40px] items-center rounded-chip bg-emerald-700 px-4 text-sm font-bold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-800 active:scale-[0.99]"
          >
            Qeydiyyat
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            aria-label={menuOpen ? "Menyunu bağla" : "Menyunu aç"}
            className={cn(
              "focus-ring flex h-11 w-11 items-center justify-center rounded-chip transition-colors duration-150 md:hidden",
              solid || menuOpen
                ? "text-stone-700 hover:bg-stone-100"
                : "text-white hover:bg-white/10",
            )}
          >
            {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </Container>

      {/* Mobil menyu — hündürlük deyil, grid-rows keçidi (layout thrash yoxdur) */}
      <div
        id="landing-mobile-menu"
        aria-hidden={!menuOpen}
        className={cn(
          "grid overflow-hidden bg-white transition-[grid-template-rows] duration-200 ease-out md:hidden",
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <Container className="flex flex-col gap-1 border-t border-stone-200 py-3">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                tabIndex={menuOpen ? undefined : -1}
                onClick={() => go(item.id)}
                className="focus-ring flex min-h-[44px] items-center rounded-chip px-3 text-left text-base font-semibold text-stone-700 transition-colors duration-150 hover:bg-stone-100"
              >
                {item.label}
              </button>
            ))}
            <Link
              to="/login"
              tabIndex={menuOpen ? undefined : -1}
              className="focus-ring mt-1 flex min-h-[44px] items-center rounded-chip px-3 text-base font-semibold text-emerald-800 transition-colors duration-150 hover:bg-emerald-50 sm:hidden"
            >
              Giriş
            </Link>
          </Container>
        </div>
      </div>
    </header>
  );
}
