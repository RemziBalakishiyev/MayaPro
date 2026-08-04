import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        // FE#69 — kölgə şkalası 3 pilləyə salınıb: kartlar `card` (çox incə),
        // üzən qatlar (menyu/popover) `overlay`, modal/drawer `panel`.
        // `soft` köhnə adla saxlanılır (deprecated alias → `card` ilə eyni).
        soft: "0 1px 2px 0 rgb(28 25 23 / 0.04), 0 1px 3px -1px rgb(28 25 23 / 0.05)",
        card: "0 1px 2px 0 rgb(28 25 23 / 0.04), 0 1px 3px -1px rgb(28 25 23 / 0.05)",
        overlay: "0 8px 24px -8px rgb(28 25 23 / 0.18)",
        panel: "0 16px 48px -12px rgb(28 25 23 / 0.28)",
      },
      borderRadius: {
        // FE#69 — vahid radius şkalası. Mövcud Tailwind sinifləri ilə eyni
        // piksel dəyərləri: card = rounded-2xl, control = rounded-xl,
        // chip = rounded-lg, tag = rounded-md.
        card: "1rem",
        control: "0.75rem",
        chip: "0.5rem",
        tag: "0.375rem",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
        // FE#69 layout standartı — sidebar eni və header hündürlüyü tək mənbədən
        sidebar: "16rem",
        header: "4rem",
        // Kontrol hündürlükləri (AC-8: əsas kontrollar ≥40px, hədəf ≥44px)
        control: "2.75rem",
        "control-sm": "2.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
