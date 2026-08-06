/**
 * FE#69 — Dizayn token-ları (TypeScript tərəfi).
 *
 * Bu modul Tailwind sinif SƏTİRLƏRİNİ tək mənbədə saxlayır ki, paylaşılan
 * primitivlər eyni spacing/radius/tipoqrafiya/rəng dilini işlətsin.
 * Yeni paket və ya CSS-in-JS qatı GƏTİRİLMİR — sadəcə mövcud Tailwind
 * siniflərinin adlandırılmış birləşmələridir.
 *
 * Sənəd: `docs/design-system.md`
 */

/* ------------------------------------------------------------------ */
/* Spacing — vahid şkala: 4 / 8 / 12 / 16 / 20 / 24 / 32 px            */
/* ------------------------------------------------------------------ */

export const SPACE = {
  /** 4px  */ xs: "0.25rem",
  /** 8px  */ sm: "0.5rem",
  /** 12px */ md: "0.75rem",
  /** 16px */ lg: "1rem",
  /** 20px */ xl: "1.25rem",
  /** 24px */ "2xl": "1.5rem",
  /** 32px */ "3xl": "2rem",
} as const;

/** Səhifə kənar padding-i — BÜTÜN route-larda eyni (AC-16). */
export const PAGE_PADDING_X = "px-4 lg:px-8";
/** Səhifə blokları arasındakı şaquli ritm. */
export const PAGE_STACK = "space-y-5";

/* ------------------------------------------------------------------ */
/* Radius                                                              */
/* ------------------------------------------------------------------ */

export const RADIUS = {
  /** Kart / panel / drawer — 16px */
  card: "rounded-card",
  /** Düymə / input / select — 12px */
  control: "rounded-control",
  /** Çip / kiçik düymə — 8px */
  chip: "rounded-chip",
  /** Badge / tag — 6px */
  tag: "rounded-tag",
  full: "rounded-full",
} as const;

/* ------------------------------------------------------------------ */
/* Kontrol hündürlükləri (AC-8)                                        */
/* ------------------------------------------------------------------ */

export const CONTROL_H = {
  /** 40px — yalnız sıx kontekstlərdə (cədvəl toolbar-ı) */
  sm: "min-h-[40px]",
  /** 44px — defolt, toxunma hədəfi */
  md: "min-h-[44px]",
  /** 52px — səhifənin əsas əməliyyatı / login */
  lg: "min-h-[52px]",
} as const;

/* ------------------------------------------------------------------ */
/* Fokus (R-15) — `src/index.css` @layer components                    */
/* ------------------------------------------------------------------ */

export const FOCUS_RING = "focus-ring";
export const FOCUS_RING_INSET = "focus-ring-inset";
export const FOCUS_RING_DARK = "focus-ring-dark";

/* ------------------------------------------------------------------ */
/* Tipoqrafiya iyerarxiyası (AC-6)                                     */
/* ------------------------------------------------------------------ */

export const TEXT = {
  /** Səhifə başlığı — h1 */
  pageTitle: "text-2xl font-bold leading-tight text-stone-900 lg:text-3xl",
  /** Səhifə alt yazısı */
  pageSubtitle: "text-base text-stone-500",
  /** Bölmə / kart başlığı — h2/h3 */
  sectionTitle: "text-lg font-bold text-stone-900",
  /** KPI və cədvəl etiketi */
  label: "text-xs font-semibold uppercase tracking-wide text-stone-500",
  /** Gövdə mətni */
  body: "text-base text-stone-700",
  /** Köməkçi / izahedici mətn (kontrast ≥4.5:1 üçün stone-500) */
  hint: "text-sm text-stone-500",
  /** Böyük rəqəm (KPI dəyəri) */
  metric: "text-xl font-bold leading-tight tabular-nums lg:text-2xl",
} as const;

/** Maliyyə dəyəri konteyneri — tabular-nums + daşmadan kəsilmə (AC-7). */
export const MONEY = "money";

/* ------------------------------------------------------------------ */
/* Semantik rəng qaydası (AC-10, AC-11)                                */
/* ------------------------------------------------------------------ */

/**
 * `success`  — uğur, müsbət maliyyə nəticəsi, əsas brend əməliyyatı (yaşıl)
 * `warning`  — xəbərdarlıq, azalan stok, gecikmiş borc, KASSA FƏRQİ (kəhrəba)
 * `danger`   — dağıdıcı əməliyyat, ziyan, kritik problem (qırmızı)
 * `info`     — neytral məlumat (göy)
 * `neutral`  — statussuz / arxiv
 *
 * DİQQƏT (R-02): müsbət kassa fərqi UĞUR deyil — `warning` tonundadır.
 */
export type SemanticTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export const TONE_SURFACE: Record<SemanticTone, string> = {
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-300",
  danger: "bg-red-50 text-red-700 ring-red-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  neutral: "bg-stone-50 text-stone-700 ring-stone-200",
};

export const TONE_TEXT: Record<SemanticTone, string> = {
  success: "text-emerald-700",
  warning: "text-amber-700",
  danger: "text-red-600",
  info: "text-sky-700",
  neutral: "text-stone-700",
};
