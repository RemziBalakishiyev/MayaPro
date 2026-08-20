# Landing (public `/`) — dizayn və performans qərarları

Bu sənəd saytın **public giriş səhifəsinin** (marketinq landing-i) qurulmasını,
verilən dizayn qərarlarını və onların əsaslandırmasını qeydə alır.

Referans: `docs/design-system.md` (FE#69 — token-lar), `.claude/skills/`
(`ui-ux-pro-max` və qoşulan dizayn skill-ləri — pattern/checklist mənbəyi),
`docs/frontend-arxitektura.md` (qovluq strukturu).

**TOXUNULMAZ qalıb:** daxili sistem səhifələrinin (`_app.*`) dizaynı,
komponentləri və biznes məntiqi. Onlarda yalnız **route yolu** dəyişib
(aşağıda bənd 1), heç bir vizual/məntiq dəyişikliyi yoxdur.

---

## 1. Route strukturu

Əvvəl `/` = daxili Dashboard idi, yəni saytın kökündə public səhifə yox idi.

| Route | Əvvəl | İndi |
|---|---|---|
| `/` | Dashboard (`_app/`) | **Public landing** (`src/routes/index.tsx`) |
| `/panel` | — | Dashboard (`_app/panel`) |

Yönləndirmə qaydaları (FE#183 rol məntiqi ilə eyni):

- `/` + daxil olmuş `sahib`/`satici` → `/panel`
- `/` + `platform_admin` → `/admin`
- `/panel` + anonim → `/login`

Dəyişən fayllar: `src/routes/_app.index.tsx` → `_app.panel.tsx` (+ testi),
`login.tsx`, `qeydiyyat.tsx`, `admin.tsx`, `_app.tsx` (NAV/TABS),
`Sidebar.tsx` (`activeOptions`), `admin.test.tsx`, `-login.test.tsx`.

## 2. Bölmə ardıcıllığı

`Hero → İmkanlar → Necə işləyir → Qiymət → Suallar → Son çağırış → Footer`

Məntiq: oxucu əvvəlcə **nə olduğunu**, sonra **necə işlədiyini** görür;
qərar anına (Qiymət) çatanda şübhələr FAQ ilə artıq cavablanır.

## 3. Dizayn şkalası — niyə daxili sistemdən fərqlidir

Token-lar EYNİDİR (emerald/stone, `rounded-card`, `shadow-*`, `focus-ring`,
Inter). Fərqlənən yalnız **şkala**dır — marketinq səthində sıxlıq deyil,
"nəfəs" lazımdır:

| | Daxili sistem | Landing |
|---|---|---|
| Bölmə arası | `space-y-5` (20px) | `py-20 → py-32` (80–128px) |
| Başlıq | `text-2xl lg:text-3xl` | h1 `2.25rem → 3.5rem`, h2 `3xl → 4xl` |
| Gövdə | `text-base` | `text-lg → text-xl`, `leading-relaxed` |
| Konteyner | `AppShell` (tam en) | `max-w-6xl px-5 sm:px-8` |

Şkala TƏK yerdə yaşayır: `src/features/landing/components/Section.tsx`
(`Container` / `Section` / `Eyebrow` / `SectionHeading`).

## 4. Hərəkət dili

Qayda mənbəyi: `src/features/landing/components/motion.ts`.

- **Kitabxana ƏLAVƏ EDİLMƏYİB.** Hər şey CSS transition/animation +
  `IntersectionObserver`. `framer-motion`/GSAP bundle-a düşmür.
- Yalnız `opacity` + `transform` animasiya olunur (GPU; layout hesablaması yox).
- Giriş keçidi: 500ms, `cubic-bezier(0.16, 1, 0.3, 1)`; mikro-interaksiyalar
  150–200ms.
- Pilləli gecikmə maksimum 240ms ilə məhdudlaşır — sıra gözlədilmir.
- **Hero JS vəziyyətindən asılı DEYİL:** `.landing-enter` CSS animasiyasıdır
  (`src/index.css`, `animation-fill-mode: both`). Əvvəl `requestAnimationFrame`
  ilə idi və arxa fonda açılan tabda kadr gəlmədiyi üçün məzmun görünməz
  qalırdı — bu risk aradan qaldırılıb.
- `Reveal` (scroll reveal) hərəkət mümkün olmayanda (`prefers-reduced-motion`
  və ya `IntersectionObserver` yoxdur) məzmunu **dərhal** göstərir.
- `prefers-reduced-motion: reduce` → bütün keçidlər söndürülür (qlobal blok
  `src/index.css`-də; ora `animation-delay` sıfırlaması da əlavə edilib).
- Lövbər linkləri JS `scrollToSection()` ilə sürüşür — qlobal
  `scroll-behavior: smooth` YAZILMAYIB ki, daxili səhifələrə təsir olmasın.

## 5. Performans

- `vite.config.ts` → `autoCodeSplitting: true`. Hər route ayrıca chunk-dır,
  landing açılanda anbar/satış/hesabat ekranları və `recharts` yüklənmir.
- **Landing-də tək bir raster şəkil yoxdur.** Hero-dakı məhsul önizləməsi
  (`DashboardPreview.tsx`) tam CSS/DOM-dur → 0 kB şəbəkə yükü, CLS yoxdur,
  lazy/ölçü problemi yaranmır.
- Fon effektləri (radial işıq, şəbəkə) CSS gradient + `mask-image`-dır,
  `blur()` yalnız bir dekorativ qatda işlədilir.

Ölçülər (`npm run build`):

| | Əvvəl | İndi |
|---|---|---|
| Tək JS bundle | 1,314.52 kB (gzip 366.43) | — |
| Giriş (entry) chunk | — | 428.24 kB (gzip 133.57) |
| Landing route chunk | — | 24.81 kB (gzip 7.12) |
| CSS | 54.68 kB (gzip 9.74) | 64.51 kB (gzip 11.21) |
| **Landing ilk yük (cəmi)** | **~1,369 kB (gzip ~376)** | **~518 kB (gzip ~152)** |

`recharts` (400.75 kB / gzip 110.39) artıq yalnız hesabat/dashboard ekranı
açılanda gəlir.

## 6. Əl ilə yoxlanılıb

- Desktop 1440px və mobil 375px (iframe viewport) — üfüqi daşma yoxdur
  (`scrollWidth === clientWidth === 375`).
- Mobil menyu açılır/bağlanır, `aria-expanded` düzgün dəyişir.
- `/` (anonim) → landing · `/` (daxil olmuş) → `/panel` · `/panel` (anonim)
  → `/login`.
- Bütün toxunma hədəfləri ≥44px (menyu bəndləri, FAQ başlıqları, CTA-lar).

## 7. Açıq qalan

- **Qiymət rəqəmi yoxdur** (biznes qərarı təsdiqlənməyib) — kart "Əlaqə
  saxlayaq" variantındadır. `PricingSection.tsx`-də TODO qeydi var: rəqəm
  təsdiqlənəndə yalnız o bloku əvəz etmək kifayətdir, kompozisiya dəyişmir.
- Lighthouse **ölçülməyib** (mühitdə Lighthouse CLI yoxdur) — yuxarıdakı
  ölçülər real bundle rəqəmləridir, bal proqnozu deyil.
