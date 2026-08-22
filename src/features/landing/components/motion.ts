/**
 * Landing hərəkət dili — TƏK mənbə.
 *
 * Qayda (hədəf auditoriya: zəif telefonda açan alverçi):
 *  - yalnız `opacity` + `transform` animasiya olunur (GPU, layout hesablaması yox)
 *  - giriş keçidləri yumşaq `ease-out` (0.16,1,0.3,1), 500–600ms
 *  - mikro-interaksiyalar qısa: 150–200ms
 *  - `prefers-reduced-motion` → heç bir hərəkət yoxdur, son vəziyyət dərhal
 *
 * Kitabxana ƏLAVƏ EDİLMİR: IntersectionObserver + CSS transition kifayətdir.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** İstifadəçi hərəkətin azaldılmasını istəyirmi? (SSR/köhnə brauzer → false) */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;

/** Giriş (reveal/mount) keçidi — bölmələr və kartlar üçün eyni əyri. */
export const ENTER_TRANSITION =
  "transition-[opacity,transform] duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none";

/** Gizli → görünən vəziyyət sinifləri. */
export const ENTER_HIDDEN = "opacity-0 translate-y-4";
export const ENTER_SHOWN = "opacity-100 translate-y-0";

/**
 * Lövbər linki üçün yumşaq sürüşmə. `scroll-behavior: smooth` qlobal CSS-ə
 * yazılmır ki, daxili sistem səhifələrinə heç bir təsir olmasın.
 * `header` hündürlüyü qədər yuxarıdan pay saxlanılır.
 */
export const scrollToSection = (id: string): void => {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({
    top,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
};
