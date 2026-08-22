import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Reveal } from "./Reveal";

/**
 * Landing tipoqrafiya və boşluq ritmi TƏK yerdə.
 *
 * Marketinq səthinin şkalası daxili sistem səhifələrindən qəsdən BÖYÜKDÜR
 * (sistem şkalası: docs/design-system.md §1.4). Burada məqsəd sıxlıq deyil,
 * "nəfəs"dir: bölmə arası 80→128px, başlıqlar 30→40px.
 */

/** Vahid sətir eni — bütün bölmələr eyni sol/sağ kənarda dayanır. */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  id,
  children,
  className,
  tone = "light",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  /** `light` — ağ, `muted` — stone-50, `dark` — emerald-950 */
  tone?: "light" | "muted" | "dark";
}) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-20 sm:py-24 lg:py-32",
        tone === "light" && "bg-white",
        tone === "muted" && "bg-stone-50",
        tone === "dark" && "bg-emerald-950 text-emerald-50",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Bölmə üstündəki kiçik etiket — gözü bölmənin mövzusuna kökləyir. */
export function Eyebrow({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <p
      className={cn(
        "text-xs font-bold uppercase tracking-[0.16em]",
        tone === "dark" ? "text-emerald-300" : "text-emerald-700",
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  tone = "light",
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "mt-3 text-balance text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl",
          tone === "dark" ? "text-white" : "text-stone-900",
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "mt-4 text-pretty text-lg leading-relaxed",
            tone === "dark" ? "text-emerald-100/80" : "text-stone-600",
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}
